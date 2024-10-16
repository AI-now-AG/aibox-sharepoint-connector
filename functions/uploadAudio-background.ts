// functions/uploadAudio.ts
import { type Handler } from '@netlify/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { AzureOpenAI } from 'openai';
import { OpenAIClient, toFile } from "@langchain/openai";

const MODEL_NAME = "whisper-1";

function getClient() {
    const endpoint = process.env.AZURE_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    return new AzureOpenAI({
        endpoint,
        apiKey,
        apiVersion,
        deployment: deploymentName,
    });
}

const uploadAudio: Handler = async (event, context) => {
    console.log("upload-----1--");
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }
    try {
        console.log("upload-----2--");
        const { fileName, uploadUrl, mimeType } = JSON.parse(event.body || '{}');
        if (!fileName || !uploadUrl) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid file upload data' }),
            };
        }

        //const fileBuffer = Buffer.from(fileData, 'base64');
        //const uploadURL = await uploadToBlobStorage(fileName, fileBuffer, mimeType);
        console.log("upload-----3--");
        const fileBuffer = await downloadFileFromBlob(uploadUrl)
        console.log("upload-----4--");
        const transcription = await transcribeUsingOpenAI(fileBuffer, fileName, mimeType, uploadUrl);
        console.log("upload-----5--");
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

async function transcribeUsingOpenAI(audioBuffer: Buffer, fileName: string, audioMimeType: string | null, uploadURL: string): Promise<string> {
    try {
        console.log("Transcribe----"+fileName);
        console.log(uploadURL);
        const openaiClient = getClient()
        //const tempFilePath = join("/tmp", fileName);
        //writeFileSync(tempFilePath, audioBuffer);
        //const audioFileStream = createReadStream(tempFilePath);
        console.log("Transcribe---a--"+uploadURL);
        const audioFile = await toFile(audioBuffer, fileName)
        console.log("Transcribe---b--"+MODEL_NAME);
        const response = await openaiClient.audio.transcriptions.create({
            file: audioFile,
            model: MODEL_NAME,
            temperature: 0,
            timestamp_granularities: ["word"],
            response_format: "verbose_json",
            prompt:
                'Eine übliche Ausdrucksweise ist "ob ORTSNAME", bspw. "ob Schwanden". das ob bedeutet in diesem Fall "oberhalb von"',
            language: "de",
        });
        console.log("Transcribe---1--");
        const fileNameWithExtension = uploadURL.split('/').pop()!.split('?')[0];
        const fileNameWithoutExtension = fileNameWithExtension.split('.').slice(0, -1).join('.');
        console.log("Transcribe---2--");
        const outputFileName = `${fileNameWithoutExtension}_output.txt`;
        console.log("fileName-out-backend-:"+outputFileName);
        await uploadOutputToBlob(outputFileName, response.text);
        return response.text;
    } catch (error) {
        console.log("Transcribe---4--");
        console.error('Error during transcription:', error);
        throw new Error('Transcription failed.');
    }
};


async function uploadOutputToBlob(blobName: string, transcription: string): Promise<string> {
    let storageURLString: string = process.env.AZURE_BLOB_STORAGE_NAME || "";
    console.log(storageURLString)
    const blobServiceClient = BlobServiceClient.fromConnectionString(storageURLString);
    const containerName = 'transcribecontainer';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const uploadResponse = await blockBlobClient.upload(transcription, transcription.length, {
        blobHTTPHeaders: { blobContentType: 'text/plain' },
    });
    console.log(`Upload successful. Request ID: ${uploadResponse.requestId}`);
    console.log(`Upload successful. URL: ${blockBlobClient.url}`);
    return blockBlobClient.url;
}

export { uploadAudio as handler };