import { type Handler } from "@netlify/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { transcribeUsingOpenAI } from "./utils/transcribe";
import { decrypt } from "$utils/secure";

const transcribeAudio: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    const requestParams = JSON.parse(event.body || "{}");

    const { fileName, uploadUrl, encryptedApiKey } = requestParams;

    if (!fileName || !uploadUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid file upload data" }),
      };
    }

    const fileBuffer = await downloadFileFromBlob(uploadUrl);
    requestParams.audioBuffer = fileBuffer;

    const azureOpenAIApiKey = decrypt(
      encryptedApiKey || process.env.AZURE_OPENAI_API_KEY2,
    );
    requestParams.azureOpenAIApiKey = azureOpenAIApiKey;

    console.log("encryptedApiKey", encryptedApiKey);
    console.log("decryptedApiKey", azureOpenAIApiKey);
    console.log("requestParams", requestParams);

    const transcription = await transcribeUsingOpenAI(requestParams);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File uploaded and transcribed successfully",
        transcription,
      }),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error during file processing or transcription",
      }),
    };
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
