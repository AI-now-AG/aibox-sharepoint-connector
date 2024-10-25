import { type Handler } from "@netlify/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { transcribeUsingOpenAI } from "./utils/transcribe";
import { decrypt } from "$utils/secure";
import { createTask, updateTask } from "$shared/store";

const transcribeAudio: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }
  try {
    const { fileName, uniqueName, uploadUrl, encryptedApiKey } = JSON.parse(
      event.body || "{}",
    );
    if (!fileName || !uploadUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid file upload data" }),
      };
    }

    const fileBuffer = await downloadFileFromBlob(uploadUrl);
    const azureOpenAIApiKey = process.env.AZURE_OPENAI_API_KEY2!

    console.log("encryptedApiKey", encryptedApiKey);
    console.log("decryptedApiKey", azureOpenAIApiKey);
    
    createTask(uniqueName, { status: "processing", error: null });
    const transcriptionResult = await transcribeUsingOpenAI(
      fileBuffer,
      fileName,
      uploadUrl,
      azureOpenAIApiKey,
    );
    if (!transcriptionResult.success) {
      updateTask(uniqueName, {
        status: "failed",
        error: transcriptionResult.error || "Unknown error during transcription.",
      });
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: transcriptionResult.error,
        }),
      };
    }
    
    updateTask(uniqueName, {
      status: "completed",
      txtUrl: transcriptionResult.data?.urls["txt"],
      srtUrl: transcriptionResult.data?.urls["srt"],
    });
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File uploaded and transcribed successfully",
        transcription: transcriptionResult.data,
      }),
    };
  } catch (error) {
    console.log(error);
    const { uniqueName } = JSON.parse(
      event.body || "{}",
    );
    updateTask(uniqueName, {
      status: "failed",
      error: error.message || "Unknown error during transcription.",
    });
  }
};

async function downloadFileFromBlob(blobUrl: string): Promise<Buffer> {
  const storageURLString: string = process.env.AZURE_BLOB_STORAGE_NAME || "";
  console.log(storageURLString);
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

// function parseContentDisposition(header: Buffer): { filename: string; fileContentType: string | null } {
//     const dispositionRegex = /filename="([^"]+)"/;
//     const contentTypeRegex = /Content-Type:\s*(.+)/;

//     const filenameMatch = header.toString().match(dispositionRegex);
//     const contentTypeMatch = header.toString().match(contentTypeRegex);

//     const filename = filenameMatch ? filenameMatch[1] : "uploaded-audio.wav";
//     const fileContentType = contentTypeMatch ? contentTypeMatch[1].trim() : null;

//     return { filename, fileContentType };
// }

export { transcribeAudio as handler };
