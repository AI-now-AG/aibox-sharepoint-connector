// functions/transcription.ts
import { AzureOpenAI } from 'openai';
import { OpenAIClient, toFile } from "@langchain/openai";
import { BlobServiceClient } from '@azure/storage-blob';
//import { createReadStream, writeFileSync } from "fs";
//import { join } from "path";

const MODEL_NAME = "whisper-1";

function getClient() {
    const endpoint = process.env.AZURE_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY2;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    return new AzureOpenAI({
        endpoint,
        apiKey,
        apiVersion,
        deployment: deploymentName,
    });
}

export async function transcribeUsingOpenAI(audioBuffer: Buffer, fileName: string, audioMimeType: string | null, uploadURL: string): Promise<string> {
    try {
        console.log("Transcribe----");
        console.log(uploadURL);
        const openaiClient = getClient()
        //const tempFilePath = join("/tmp", fileName);
        //writeFileSync(tempFilePath, audioBuffer);
        //const audioFileStream = createReadStream(tempFilePath);
        console.log("Transcribe---a--");
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