// functions/transcription.ts
import { AzureOpenAI } from 'openai';
import { OpenAIClient, toFile } from "@langchain/openai";
//import { createReadStream, writeFileSync } from "fs";
//import { join } from "path";

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

export async function transcribeUsingOpenAI(audioBuffer: Buffer, fileName: string, audioMimeType: string | null, uploadURL: string): Promise<string> {
    try {
        const openaiClient = getClient()
        //const tempFilePath = join("/tmp", fileName);
        //writeFileSync(tempFilePath, audioBuffer);
        //const audioFileStream = createReadStream(tempFilePath);
        const audioFile = await toFile(audioBuffer, fileName)
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
        return response.text;
    } catch (error) {
        console.error('Error during transcription:', error);
        throw new Error('Transcription failed.');
    }
};
