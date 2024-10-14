// functions/uploadAudio.ts
import { type Handler } from '@netlify/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { transcribeUsingOpenAI } from './transcribeAudio';

const uploadAudio: Handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }
    try {
        const { fileName, fileData, mimeType } = JSON.parse(event.body || '{}');
        if (!fileName || !fileData) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid file upload data' }),
            };
        }

        const fileBuffer = Buffer.from(fileData, 'base64');
        const uploadURL = await uploadToBlobStorage(fileName, fileBuffer, mimeType);
        const transcription = await transcribeUsingOpenAI(fileBuffer, fileName, mimeType, uploadURL);

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