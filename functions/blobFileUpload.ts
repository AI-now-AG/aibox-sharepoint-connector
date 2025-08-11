import { BlobServiceClient, BlobSASPermissions } from "@azure/storage-blob";
import type { Handler } from "@netlify/functions";
import { v4 as uuid } from "uuid";
import { type FileInput } from "$types/FileInput";

const containerName = "fileuploadcontainer";

/**
 * Sanitizes filename for safe storage and downloading
 * - Replaces spaces with underscores
 * - Removes special characters except dots, hyphens, and underscores
 * - Preserves file extension
 * - Limits length to prevent issues
 */
function sanitizeFilename(filename: string): string {
  // Extract extension
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  
  // Sanitize the name part
  const sanitizedName = name
    .replace(/\s+/g, '_')                    // Replace spaces with underscores
    .replace(/[^a-zA-Z0-9._-]/g, '')         // Remove special characters
    .replace(/_{2,}/g, '_')                  // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '')                 // Remove leading/trailing underscores
    .substring(0, 100);                      // Limit length
  
  // Sanitize extension
  const sanitizedExtension = extension
    .replace(/[^a-zA-Z0-9.]/g, '')          // Keep only alphanumeric and dots
    .substring(0, 10);                       // Limit extension length
  
  return sanitizedName + sanitizedExtension;
}

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
      const sanitizedFilename = sanitizeFilename(file.name);
      const blobName = `${folderName}/${uuid()}-${sanitizedFilename}`;
      
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
