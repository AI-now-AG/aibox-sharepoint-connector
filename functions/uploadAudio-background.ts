// functions/uploadAudio.ts
import { type Handler } from '@netlify/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { transcribeUsingOpenAI } from './transcribeAudio-background';

const uploadAudio: Handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }
    try {
        const { fileName, uploadUrl, mimeType } = JSON.parse(event.body || '{}');
        if (!fileName || !uploadUrl) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid file upload data' }),
            };
        }

        //const fileBuffer = Buffer.from(fileData, 'base64');
        //const uploadURL = await uploadToBlobStorage(fileName, fileBuffer, mimeType);
        const fileBuffer = await downloadFileFromBlob(uploadUrl)
        const transcription = await transcribeUsingOpenAI(fileBuffer, fileName, mimeType, uploadUrl);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'File uploaded and transcribed successfully',
                transcription,
            }),
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error during file processing or transcription' }),
        };
    }
};


async function uploadToBlobStorage(audioFileName: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
    let storageURLString: string = process.env.AZURE_BLOB_STORAGE_NAME || "";
    console.log(storageURLString)
    const blobServiceClient = BlobServiceClient.fromConnectionString(storageURLString);
    const containerName = 'transcribecontainer';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(audioFileName);

    const uploadResponse = await blockBlobClient.uploadData(fileBuffer, {
        blobHTTPHeaders: { blobContentType: mimeType || 'audio/mpeg' },
    });
    console.log(`Upload successful. Request ID: ${uploadResponse.requestId}`);
    console.log(`Upload successful. URL: ${blockBlobClient.url}`);
    return blockBlobClient.url;
}

async function downloadFileFromBlob(blobUrl: string): Promise<Buffer> {
    let storageURLString: string = process.env.AZURE_BLOB_STORAGE_NAME || "";
    console.log(storageURLString)
    const blobServiceClient = BlobServiceClient.fromConnectionString(storageURLString);
    

    const url = new URL(blobUrl);
    const blobPath = url.pathname.split('/'); 
    const containerName = blobPath[1]; 
    const blobName = blobPath.slice(2).join('/');
    
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    
    const downloadBlockBlobResponse = await blobClient.download(0);
    const downloaded = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody!);
    
    return downloaded;
}

async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
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

export { uploadAudio as handler };
