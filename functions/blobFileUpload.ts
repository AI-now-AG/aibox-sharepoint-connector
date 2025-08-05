import { BlobServiceClient, BlobSASPermissions } from "@azure/storage-blob";
import type { Handler } from "@netlify/functions";
import { v4 as uuid } from "uuid";
import { type FileInput } from "$types/FileInput";

const containerName = "fileuploadcontainer";

async function getBlobServiceClient() {
  const connectionString = process.env.AZURE_BLOB_STORAGE_NAME || "";
  if (!connectionString) {
    throw new Error("Azure storage configuration is missing.");
  }
  return BlobServiceClient.fromConnectionString(connectionString);
}

const blobFileUpload: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const files: FileInput[] = body?.files ?? [];
    const folderName: string = body?.folderName || "default";
    console.log("Uploading files:", files);
    const blobServiceClient = await getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();

    const results: string[] = [];
    for (const file of files) {
      const blobName = `${folderName}/${uuid()}-${file.name}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      // Convert base64 to buffer
      const buffer = Buffer.from(file.content.split(',')[1], 'base64');
      await blockBlobClient.upload(buffer, buffer.length);
      
      const sasUrl = await blockBlobClient.generateSasUrl({
        permissions: BlobSASPermissions.parse("r"),
        expiresOn: new Date(new Date().getTime() + 6 * 60 * 60 * 1000), // Expire in 6 hours
      });
      
      results.push(sasUrl);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ results }),
    };
  } catch (error) {
    console.error("Error uploading files:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: error instanceof Error ? error.message : "Unknown error during file upload" 
      }),
    };
  }
};

export { blobFileUpload as handler };
