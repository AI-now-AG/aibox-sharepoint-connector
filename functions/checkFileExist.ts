import { BlobServiceClient } from "@azure/storage-blob";
import { type Handler } from "@netlify/functions";
import { join } from "path";
import { tmpdir } from "os";
import AdmZip from "adm-zip";
import { createWriteStream, unlinkSync, existsSync } from "fs";
import { promisify } from "util";
import { pipeline } from "stream";
import {
  BatchStatus,
  getCurrentBatchStatus,
  getTask,
} from "$shared/transcriptionTasks";
import { FileFormat, TranscriptionType } from "$types/TranscribeRequest";
import {
  pollTranscriptionTask1,
  updateStatus,
} from "./utils/batchTranscription";
import { decrypt } from "$utils/secure";

const checkFileExist: Handler = async (event, context) => {
  const {
    tenantId,
    userId,
    uniqueName,
    fileNames,
    folderName,
    isShowImprovedTextPreview,
    typedTranscriptionType,
    isDiarizationEnabled,
    encryptedSpeechKey,
  } = JSON.parse(event.body!);
  let requireFilesCount = fileNames.length || 0;
  const tempFileNames: string[] = [];

  const improvedTxtFileName = `${uniqueName}_improved.txt`;
  if (isShowImprovedTextPreview) {
    requireFilesCount += 1;
    tempFileNames.push(improvedTxtFileName);
  }

  const txtFileName = isDiarizationEnabled
    ? `${uniqueName}-mono.txt`
    : `${uniqueName}.txt`;
  if (!fileNames.includes(txtFileName) && !isShowImprovedTextPreview) {
    requireFilesCount += 1;
    tempFileNames.push(txtFileName);
  }
  if ((fileNames?.length || tempFileNames.length) && uniqueName) {
    const streamPipeline = promisify(pipeline);
    const tmpDir = tmpdir();
    const storageURLString =
      typedTranscriptionType === TranscriptionType.Largefile ||
      typedTranscriptionType === TranscriptionType.SubtitleLarge
        ? process.env.AZURE_BLOB_LARGE_STORAGE_NAME || ""
        : process.env.AZURE_BLOB_STORAGE_NAME || "";
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(storageURLString);
    const containerName =
      typedTranscriptionType === TranscriptionType.Largefile ||
      typedTranscriptionType === TranscriptionType.SubtitleLarge
        ? process.env.AZURE_LARGE_CONTAINER_NAME || "transcribe-container"
        : process.env.AZURE_CONTAINER_NAME || "transcribecontainer";
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const availableFiles: string[] = [];
    const downloadedFiles: { name: string; path: string }[] = [];
    try {
      let txtFileUrl = "";
      let srtFileUrl = "";
      let assFileUrl = "";
      let jsonFileUrl = "";
      let rawTxtContent = "";
      await checkAndUploadLargeFile(
        tenantId,
        userId,
        uniqueName,
        typedTranscriptionType,
        isDiarizationEnabled,
        encryptedSpeechKey,
        folderName,
        isShowImprovedTextPreview,
      );

      // Check if the file exists in Azure Blob Storage
      const allFileNames = [...fileNames, ...tempFileNames];
      for (const fileName of allFileNames) {
        const filePathInBlob = `${folderName}/${fileName}`;
        const blobClient = containerClient.getBlobClient(filePathInBlob);
        const exists = await blobClient.exists();
        if (!exists) {
          const task = await getTask(uniqueName);
          if (!task) {
            return {
              statusCode: 404,
              body: JSON.stringify({
                exists: false,
                message: "File does not exist",
              }),
            };
          } else {
            if (task.error) {
              return {
                statusCode: 500,
                body: JSON.stringify({
                  exists: false,
                  message: "Failed to check file existence or download content",
                  error: task.error,
                }),
              };
            } else {
              return {
                statusCode: 200,
                body: JSON.stringify(task),
              };
            }
          }
        }
        availableFiles.push(fileName);
        const filePath = join(tmpDir, fileName);
        const downloadBlockBlobResponse = await blobClient.download();

        // Ensure the file is written to the file system
        const fileStream = createWriteStream(filePath);
        await streamPipeline(
          downloadBlockBlobResponse.readableStreamBody!,
          fileStream,
        );
        const fileUrl = blobClient.url;
        if (fileName.endsWith(".srt")) {
          srtFileUrl = fileUrl; // Store the URL for the .srt file
        } else if (fileName.endsWith(".ass")) {
          assFileUrl = fileUrl; // Store the URL for the .ass file
        } else if (fileName.endsWith(".json")) {
          jsonFileUrl = fileUrl; // Store the URL for the .ass file
        } else if (fileName.endsWith(".txt")) {
          if (typedTranscriptionType === TranscriptionType.Subtitles) {
            txtFileUrl = fileUrl; // Store the URL for the .txt file
          }
        }

        if (fileName.endsWith(".txt") || fileName.endsWith("_improved.txt")) {
          const downloadBlockBlobResponse = await blobClient.download();
          rawTxtContent = await streamToString(
            downloadBlockBlobResponse.readableStreamBody!,
          );
        }

        if (!downloadedFiles.some((file) => file.name === fileName)) {
          if (!fileName.endsWith("_improved.txt")) {
            downloadedFiles.push({ name: fileName, path: filePath });
          }
        }
      }
      if (availableFiles.length >= requireFilesCount) {
        let zipBuffer: Buffer | null = null;
        if (fileNames.length > 1) {
          zipBuffer = await createZip(downloadedFiles);
        }
        return {
          statusCode: 200,
          body: JSON.stringify({
            exists: true,
            text_output: rawTxtContent,
            txt_file: txtFileUrl,
            srt_file: srtFileUrl,
            ass_file: assFileUrl,
            json_file: jsonFileUrl,
            zip_file: zipBuffer?.toString("base64") || "",
          }),
        };
      } else {
        const task = await getTask(uniqueName);
        return {
          statusCode: 200,
          body: JSON.stringify(task),
        };
      }
    } catch (error: any) {
      console.error(
        "Error checking file existence or downloading content:",
        error,
      );
      return {
        statusCode: 500,
        body: JSON.stringify({
          exists: false,
          message: "Failed to check file existence or download content",
          error: error.message,
        }),
      };
    }
  } else {
    return {
      statusCode: 500,
      body: JSON.stringify({
        exists: false,
        message: "Failed to get file list",
      }),
    };
  }
};

const checkAndUploadLargeFile = async (
  tenantId: string,
  userId: string,
  uniqueName: string,
  typedTranscriptionType: TranscriptionType,
  isDiarizationEnabled: boolean,
  encryptedSpeechKey: string,
  folderName: string,
  isShowImprovedTextPreview: boolean,
): Promise<void> => {
  if (
    typedTranscriptionType !== TranscriptionType.Largefile &&
    typedTranscriptionType !== TranscriptionType.SubtitleLarge
  )
    return;
  const task = await getTask(uniqueName);
  if (!task || !task.status || !task.batchUpdate) {
    console.log("Task not found or incomplete.");
    return;
  }

  const currentBatch = getCurrentBatchStatus(task.batchUpdate);
  if (currentBatch.succeeded || currentBatch.failed) {
    console.log("Batch processing completed.");
    return;
  }

  const taskURL = task.batchUpdate.find((batch) => batch.taskUrl)?.taskUrl;
  if (!taskURL) {
    console.log("No task URL found.");
    return;
  }

  const outputURL = task.output_url ?? taskURL;
  const azureSpeechKey = decrypt(
    encryptedSpeechKey || process.env.AZURE_LARGE_SPEECH_KEY!,
  );

  try {
    const response = await pollingAndStatus(
      taskURL,
      uniqueName,
      azureSpeechKey,
    );
    if (!response.isRunning && response.fileURL) {
      await postAudioProProcess(
        tenantId,
        userId,
        uniqueName,
        outputURL,
        folderName,
        isDiarizationEnabled,
        response.fileURL,
        encryptedSpeechKey,
        typedTranscriptionType,
        task.selectedFileFormat,
        isShowImprovedTextPreview,
      );
    }
  } catch (error) {
    console.error("Error during polling or file upload:", error);
  }
};

async function createZip(
  downloadedFiles: { name: string; path: string }[],
): Promise<Buffer> {
  const zip = new AdmZip();

  downloadedFiles.forEach((file) => {
    zip.addLocalFile(file.path);
  });

  const zipBuffer = zip.toBuffer();

  downloadedFiles.forEach((file) => {
    if (existsSync(file.path)) {
      try {
        unlinkSync(file.path);
      } catch (err) {
        console.error(`Failed to delete file: ${file.path}`, err);
      }
    }
  });
  return zipBuffer;
}

async function streamToString(
  readableStream: NodeJS.ReadableStream | null,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    readableStream?.on("data", (data) => chunks.push(data));
    readableStream?.on("end", () =>
      resolve(Buffer.concat(chunks).toString("utf-8")),
    );
    readableStream?.on("error", reject);
  });
}

export async function pollingAndStatus(
  taskUrl: string,
  uniqueName: string,
  subscriptionKey: string,
): Promise<{ isRunning: boolean; fileURL?: string; error?: Error }> {
  try {
    const pollResponse = await pollTranscriptionTask1(
      taskUrl,
      uniqueName,
      subscriptionKey,
    );
    if (pollResponse.status === BatchStatus.Succeeded) {
      return { isRunning: false, fileURL: pollResponse.links.files };
    } else if (pollResponse.status === BatchStatus.Failed) {
      throw new Error(
        `Transcription failed: ${pollResponse.properties.error?.message}`,
      );
    }
    return { isRunning: true };
  } catch (error) {
    updateStatus({
      uniqueName,
      name: "Batch task failed",
      status: "Failed",
      error: `${error}`,
    });
    throw error;
  }
}

async function postAudioProProcess(
  tenantId: string,
  userId: string,
  uniqueName: string,
  uploadUrl: string,
  folderName: string,
  enableDiarization: boolean = false,
  fileURL: string,
  encryptedSpeechKey: string,
  typedTranscriptionType: TranscriptionType,
  selectedFileFormat?: FileFormat[],
  isShowImprovedTextPreview: boolean = false,
): Promise<void> {
  try {
    const response = await fetch(
      `${process.env.URL}/.netlify/functions/postAudioProProcess-background`,
      //`https://deploy-preview-153.test.aibox-app.com/.netlify/functions/postAudioProProcess-background`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          userId,
          uniqueName,
          uploadUrl,
          folderName,
          enableDiarization,
          fileURL,
          encryptedSpeechKey,
          typedTranscriptionType,
          selectedFileFormat,
          isShowImprovedTextPreview,
        }),
      },
    );
    if (response.status === 202) {
      console.log("Background function triggered successfully.");
    } else {
      const errorText = await response.text();
      console.error(
        "Failed to trigger background function:",
        response.status,
        errorText,
      );
    }
  } catch (error) {
    console.error("Error triggering background function:", error);
  }
}
export { checkFileExist as handler };
