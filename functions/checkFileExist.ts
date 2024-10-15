import { BlobServiceClient } from '@azure/storage-blob';
import { type Handler } from '@netlify/functions';

const checkFileExist: Handler = async (event, context) => {
    const { fileName } = JSON.parse(event.body!);
    let storageURLString: string = process.env.AZURE_BLOB_STORAGE_NAME || "";
    console.log(storageURLString)
    const blobServiceClient = BlobServiceClient.fromConnectionString(storageURLString);
    const containerName = 'transcribecontainer';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    const blobClient = containerClient.getBlobClient(fileName);

    try {
        // Check if the file exists in Azure Blob Storage
        const exists = await blobClient.exists();

        if (!exists) {
            return {
                statusCode: 404,
                body: JSON.stringify({ exists: false, message: 'File does not exist' }),
            };
        }

        // Download the file content
        const downloadBlockBlobResponse = await blobClient.download();
        const downloadedContent = await streamToString(downloadBlockBlobResponse.readableStreamBody!);

        return {
            statusCode: 200,
            body: JSON.stringify({ exists: true, transcription: downloadedContent }),
        };
    } catch (error) {
        console.error('Error checking file existence or downloading content:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to check file existence or download content' }),
        };
    }
};

// Helper function to convert readable stream to string
async function streamToString(readableStream: NodeJS.ReadableStream | null): Promise<string> {
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

export { checkFileExist as handler };
