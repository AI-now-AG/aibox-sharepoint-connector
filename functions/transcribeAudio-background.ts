import {
  type Handler,
  type HandlerEvent,
  type HandlerResponse,
} from "@netlify/functions";
import {
  BlobServiceClient,
  type BlobDownloadResponseParsed,
} from "@azure/storage-blob";
import {
  transcribeUsingOpenAI,
  transcribeUsingAzureOpenAI,
} from "./utils/transcribe";
import { decrypt } from "$utils/secure";
import { createTask, updateTask } from "$shared/transcriptionTasks";
import {
  TranscriptionType,
  type TranscribeRequest,
  type TranscriptionResult,
} from "$utils/TranscribeRequest";
import { ObjectId } from "mongodb";
import ffmpeg from "fluent-ffmpeg";
import stream from "stream";
import path from "path";
import os from "os";
import { Readable } from "stream";

// const ffmpegPath = path.join(process.cwd(), 'bin', 'osx', 'ffmpeg');
let ffmpegPath: string;
const platform = os.platform();
const arch = os.arch();

if (platform === "darwin" && arch === "arm64") {
  ffmpegPath = path.join(__dirname, "..", "bin", "osx", "ffmpeg");
} else if (platform === "linux" && arch === "x64") {
  ffmpegPath = path.join(__dirname, "..", "bin", "linux", "ffmpeg");
} else {
  throw new Error(`Unsupported platform: ${platform} (${arch})`);
}

const transcribeAudio: Handler = async (
  event: HandlerEvent,
): Promise<HandlerResponse> => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    const transcribeParams: TranscribeRequest = JSON.parse(event.body || "{}");
    const {
      fileName,
      uniqueName,
      uploadUrl,
      transcriptionType,
      encryptedApiKey,
    } = transcribeParams;

    if (!fileName || !uploadUrl || !transcriptionType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid file upload data" }),
      };
    }

    const azureOpenAIApiKey = decrypt(
      encryptedApiKey || process.env.AZURE_OPENAI_API_KEY2!,
    );
    transcribeParams.azureOpenAIApiKey = azureOpenAIApiKey;

    console.log("encryptedApiKey", encryptedApiKey);
    console.log("decryptedApiKey", azureOpenAIApiKey);
    createTask(uniqueName, {
      tenant_id: new ObjectId(transcribeParams.tenantId),
      creator_id: new ObjectId(transcribeParams.userId),
      status: "processing",
    });
    let transcriptionResult: TranscriptionResult = {
      success: false,
      data: null,
      error: null,
    };
    if (transcriptionType === TranscriptionType.Largefile) {
      if (transcribeParams.isDiarizationEnabled) {
        const newBlobFileUrl = await convertStereoToMono(
          uploadUrl,
          transcriptionType,
          transcribeParams.folderName,
          uniqueName,
        );
        if (newBlobFileUrl) {
          transcribeParams.uploadUrl = newBlobFileUrl;
          transcriptionResult =
            await transcribeUsingAzureOpenAI(transcribeParams);
        }
      } else {
        transcriptionResult =
          await transcribeUsingAzureOpenAI(transcribeParams);
      }
    } else {
      const fileBuffer = await downloadFileFromBlob(
        uploadUrl,
        transcriptionType,
      );
      transcribeParams.audioBuffer = fileBuffer;
      transcriptionResult = await transcribeUsingOpenAI(transcribeParams);
    }
    if (!transcriptionResult.success) {
      updateTask(uniqueName, {
        status: "failed",
        error:
          transcriptionResult.error || "Unknown error during transcription.",
      });
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: transcriptionResult.error,
        }),
      };
    } else {
      updateTask(uniqueName, {
        status: "completed",
        txtUrl: transcriptionResult.data?.urls["txt"],
        srtUrl: transcriptionResult.data?.urls["srt"] ?? "",
        assUrl: transcriptionResult.data?.urls["ass"] ?? "",
      });
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "File uploaded and transcribed successfully",
          transcription: transcriptionResult.data,
        }),
      };
    }
  } catch (error) {
    console.error("Error while transcribing:" + error);
    const { uniqueName = "unknown_task" } = JSON.parse(event.body || "{}");

    if (error instanceof Error) {
      updateTask(uniqueName, {
        status: "failed",
        error: error.message,
      });
    } else {
      updateTask(uniqueName, {
        status: "failed",
        error: "Unknown error during transcription.",
      });
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message:
          error instanceof Error
            ? error.message
            : "Unknown error during transcription",
      }),
    };
  }
};

async function convertStereoToMono(
  blobUrl: string,
  typedTranscriptionType: TranscriptionType,
  folderName: string,
  uniqueName: string,
): Promise<string | null> {
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

  const downloadBlockBlobResponse = (
    await downloadFile(blobUrl, typedTranscriptionType)
  ).readableStreamBody as Readable;

  const filename = blobUrl.includes("?") ? blobUrl.split("?")[0] : blobUrl;
  const fileExtension = filename.split(".").pop();

  let fileUrl = null;
  if (fileExtension) {
    const convertedBlobName = `${folderName}/${uniqueName}-mono.${fileExtension}`;
    const monoBlobClient =
      containerClient.getBlockBlobClient(convertedBlobName);
    const outputStream = new stream.PassThrough();
    try {
      let isSuccess = false;
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .setFfmpegPath(ffmpegPath)
          .input(downloadBlockBlobResponse)
          .audioChannels(1)
          .format(fileExtension)
          .output(outputStream)
          .on("error", (err) => {
            console.error("FFmpeg error:", err);
            updateTask(uniqueName, {
              status: "failed",
              error: err.message,
            });
            reject(err);
          })
          .on("end", () => {
            isSuccess = true;
            resolve();
          })
          .run();
      });
      if (isSuccess) {
        await monoBlobClient.uploadStream(outputStream);
        fileUrl = monoBlobClient.url;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Catch Ffmpeg error:", error);
        updateTask(uniqueName, {
          status: "failed",
          error: error.message,
        });
      } else {
        console.error("Unknown error occurred:", error);
      }
    }
  }
  return fileUrl;
}

async function downloadFileFromBlob(
  blobUrl: string,
  typedTranscriptionType: TranscriptionType,
): Promise<Buffer> {
  try {
    const downloadBlockBlobResponse = await downloadFile(
      blobUrl,
      typedTranscriptionType,
    );
    const downloaded = await streamToBuffer(
      downloadBlockBlobResponse.readableStreamBody!,
    );

    return downloaded;
  } catch (error) {
    console.error("Error in downloadFileFromBlob:", error);
    throw new Error("Failed to download file from Blob Storage.");
  }
}

async function downloadFile(
  blobUrl: string,
  typedTranscriptionType: TranscriptionType,
): Promise<BlobDownloadResponseParsed> {
  const storageURLString =
    typedTranscriptionType === TranscriptionType.Largefile
      ? process.env.AZURE_BLOB_LARGE_STORAGE_NAME || ""
      : process.env.AZURE_BLOB_STORAGE_NAME || "";
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(storageURLString);

  const url = new URL(blobUrl);
  const blobPath = url.pathname.split("/");
  const containerName = blobPath[1];
  const blobName = blobPath.slice(2).join("/");

  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);

  return await blobClient.download(0);
}

async function streamToBuffer(
  readableStream: NodeJS.ReadableStream,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}

export { transcribeAudio as handler };
