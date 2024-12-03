import {
  type Handler,
  type HandlerEvent,
  type HandlerResponse,
} from "@netlify/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { transcribeUsingOpenAI } from "./utils/transcribe";
import { decrypt } from "$utils/secure";
import { createTask, updateTask } from "$shared/transcriptionTasks";
import type { TranscribeRequest } from "$utils/TranscribeRequest";

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
    const { fileName, uniqueName, uploadUrl, encryptedApiKey } =
      transcribeParams;

    if (!fileName || !uploadUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid file upload data" }),
      };
    }

    const fileBuffer = await downloadFileFromBlob(uploadUrl);
    transcribeParams.audioBuffer = fileBuffer;

    const azureOpenAIApiKey = decrypt(
      encryptedApiKey || process.env.AZURE_OPENAI_API_KEY2!,
    );
    transcribeParams.azureOpenAIApiKey = azureOpenAIApiKey;

    console.log("encryptedApiKey", encryptedApiKey);
    console.log("decryptedApiKey", azureOpenAIApiKey);

    createTask(uniqueName, { status: "processing" });
    const transcriptionResult = await transcribeUsingOpenAI(transcribeParams);

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
        srtUrl: transcriptionResult.data?.urls["srt"],
        assUrl: transcriptionResult.data?.urls["ass"],
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

async function downloadFileFromBlob(blobUrl: string): Promise<Buffer> {
  try {
    const storageURLString: string = process.env.AZURE_BLOB_STORAGE_NAME || "";
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(storageURLString);

    const url = new URL(blobUrl);
    const blobPath = url.pathname.split("/");
    const containerName = blobPath[1];
    const blobName = blobPath.slice(2).join("/");

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    const downloadBlockBlobResponse = await blobClient.download(0);
    const downloaded = await streamToBuffer(
      downloadBlockBlobResponse.readableStreamBody!,
    );

    return downloaded;
  } catch (error) {
    console.error("Error in downloadFileFromBlob:", error);
    throw new Error("Failed to download file from Blob Storage.");
  }
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
