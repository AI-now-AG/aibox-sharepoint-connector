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
import { TranscriptionType } from "$types/TranscribeRequest";
import {
  pollTranscriptionTask1,
  processTranscriptionResult,
  updateStatus,
} from "./utils/batchTranscription";
import type { TranscriptionResponse } from "$utils/Speech/SpeechResponse";
import { decrypt } from "$utils/secure";

const checkFileExist: Handler = async (event, context) => {
  const {
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
      typedTranscriptionType === TranscriptionType.Largefile
        ? process.env.AZURE_BLOB_LARGE_STORAGE_NAME || ""
        : process.env.AZURE_BLOB_STORAGE_NAME || "";
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(storageURLString);
    const containerName =
      typedTranscriptionType === TranscriptionType.Largefile
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
        uniqueName,
        typedTranscriptionType,
        isDiarizationEnabled,
        encryptedSpeechKey,
        folderName,
      );

      // Check if the file exists in Azure Blob Storage
      for (const fileName of fileNames) {
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
            return {
              statusCode: 200,
              body: JSON.stringify(task),
            };
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
          txtFileUrl = fileUrl; // Store the URL for the .txt file
        } else if (fileName.endsWith("_improved.txt")) {
          // Download and read the raw text content of the .txt file
          const downloadBlockBlobResponseStr = await blobClient.download();
          rawTxtContent = await streamToString(
            downloadBlockBlobResponseStr.readableStreamBody!,
          );
        }

        if (!downloadedFiles.some((file) => file.name === fileName)) {
          downloadedFiles.push({ name: fileName, path: filePath });
        }

        //const downloadBlockBlobResponse = await blobClient.download()
        //const downloadedContent = await streamToString(downloadBlockBlobResponse.readableStreamBody!);
      }
      for (const fileName of tempFileNames) {
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

        if (fileName.endsWith(".txt")) {
          // Download and read the raw text content of the .txt file
          const downloadBlockBlobResponse = await blobClient.download();
          rawTxtContent = await streamToString(
            downloadBlockBlobResponse.readableStreamBody!,
          );
        } else if (fileName.endsWith("_improved.txt")) {
          // Download and read the raw text content of the .txt file
          const downloadBlockBlobResponseStr = await blobClient.download();
          rawTxtContent = await streamToString(
            downloadBlockBlobResponseStr.readableStreamBody!,
          );
        }
      }
      //console.log(downloadedFiles);
      // return {
      //     statusCode: 200,
      //     body: JSON.stringify({ exists: true, transcriptionFile: zipBuffer }),
      // };
      if (availableFiles.length >= requireFilesCount) {
        let zipBuffer: Buffer | null = null;
        if (fileNames.length > 1) {
          zipBuffer = await createZip(downloadedFiles);
        }
        return {
          statusCode: 200,
          /*headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="transcription_files.zip"',
          },
          body: zipBuffer.toString('base64'), // Convert the binary zip buffer to base64 for safe transmission
          isBase64Encoded: true, // Indicate the body is base64 encoded*/
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
  uniqueName: string,
  typedTranscriptionType: TranscriptionType,
  isDiarizationEnabled: boolean,
  encryptedSpeechKey: string,
  folderName: string,
): Promise<void> => {
  if (typedTranscriptionType !== TranscriptionType.Largefile) return;

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
  const subscriptionKey = azureSpeechKey ?? process.env.AZURE_LARGE_SPEECH_KEY!;

  try {
    const response = await pollingAndStatus(
      taskURL,
      uniqueName,
      subscriptionKey,
    );
    if (!response.isRunning && response.fileURL) {
    //if (response.jsonData && response.transcriptionText) {
      console.log("Transcription completed. Uploading files...");
      await postAudioProProcess(
        uniqueName,
        outputURL,
        folderName,
        isDiarizationEnabled,
        response.fileURL,
        encryptedSpeechKey,
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

  // Add each file to the zip
  downloadedFiles.forEach((file) => {
    console.log(`Adding file to zip: ${file.path}`);
    zip.addLocalFile(file.path);
  });

  // Generate a buffer of the zip content
  const zipBuffer = zip.toBuffer();

  // Clean up: delete the downloaded files after zipping
  downloadedFiles.forEach((file) => {
    console.log(`Attempting to delete file: ${file.path}`);
    if (existsSync(file.path)) {
      try {
        unlinkSync(file.path); // Ensure file exists before deletion
        console.log(`File deleted: ${file.path}`);
      } catch (err) {
        console.error(`Failed to delete file: ${file.path}`, err);
      }
    } else {
      console.warn(`File not found during deletion: ${file.path}`);
    }
  });

  return zipBuffer;
}

// Helper function to convert readable stream to string
async function streamToString(
  readableStream: NodeJS.ReadableStream | null,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    readableStream?.on("data", (data) => {
      chunks.push(data);
    });
    readableStream?.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf-8"));
    });
    readableStream?.on("error", reject);
  });
}

export async function pollingAndStatus(
  taskUrl: string,
  uniqueName: string,
  subscriptionKey: string,
): Promise<{
  isRunning: boolean;
  fileURL?: string;
  error?: Error;
}> {
  try {
    const pollResponse = await pollTranscriptionTask1(
      taskUrl,
      uniqueName,
      subscriptionKey,
    );
    if (pollResponse.status === BatchStatus.Succeeded) {
      /*const transcriptionData = await processTranscriptionResult(
        uniqueName,
        enableDiarization,
        pollResponse.links.files,
        subscriptionKey,
      );
      return { isRunning: false, ...transcriptionData };*/
      return { isRunning: false, fileURL: pollResponse.links.files };
    } else if (pollResponse.status === BatchStatus.Failed) {
      console.error(
        `Transcription failed: ${pollResponse.properties.error?.message}`,
      );
      throw new Error(
        `Transcription failed: ${pollResponse.properties.error?.message}`,
      );
      return { isRunning: false };
    } else {
      return { isRunning: true };
    }
  } catch (error) {
    updateStatus({
      uniqueName,
      name: "Batch task failed",
      status: "Failed",
      error: `${error}`,
    });
    console.error("Error processing transcription:", error);
    throw error;
  }
}

async function postAudioProProcess(
  uniqueName: string,
  uploadUrl: string,
  folderName: string,
  enableDiarization: boolean = false,
  fileURL: string,
  encryptedSpeechKey: string,
): Promise<void> {
  try {
    console.log("Triggering background function...");
    console.log(process.env.context);
    const baseUrl = (process.env.context === 'production' ? process.env.URL : process.env.DEPLOY_PRIME_URL) || 'http://localhost:8888';
    console.log(baseUrl);
    console.log(process.env.URL);
    console.log(process.env.DEPLOY_URL);
    console.log(process.env.DEPLOY_PRIME_URL);
    console.log(process.env.DEPLOY_ID);
    console.log(process.env.SITE_NAME);
    console.log(process.env.SITE_ID);
    console.log(process.env.REVIEW_ID);
    console.log("Triggering background function...END");
    const response = await fetch(
      // `${process.env.URL}/.netlify/functions/postAudioProProcess-background`,
      `https://deploy-preview-153.test.aibox-app.com/.netlify/functions/postAudioProProcess-background`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uniqueName,
          uploadUrl,
          folderName,
          enableDiarization,
          fileURL,
          encryptedSpeechKey,
        }),
      },
    );
    console.log("Response:", response);
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
