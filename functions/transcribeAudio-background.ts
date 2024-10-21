import { BlobServiceClient } from '@azure/storage-blob';
import { AzureChatOpenAI, OpenAIClient, toFile } from "@langchain/openai";
import { AzureOpenAI } from 'openai';
import { groupLines, formatSRT, createSRTData, type InputEntry } from "./srt";
import { improveTextQuality } from "./improve-text";
import { StringOutputParser } from '@langchain/core/output_parsers';

const MODEL_NAME = "whisper-1";

const azureChatConfig = {
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY2,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME2,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
};

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

async function getAzureResponse(prompt: string) {
  try {
    const chat = new AzureChatOpenAI(azureChatConfig);
    const response = await chat.invoke(prompt);
    return response;
  } catch (error) {
    console.error("Error communicating with Azure OpenAI:", error);
    throw error;
  }
}

export async function transcribeUsingOpenAI(audioBuffer: Buffer, fileName: string, audioMimeType: string | null, uploadURL: string): Promise<string> {
  try {
    console.log(uploadURL);
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
      // language: "de",
    });
    const transcriptionResponse = await getAzureResponse(response.text);
    const parser = new StringOutputParser();
    const description = await parser.invoke(transcriptionResponse);
    const srtData = createSRTData(
      (response as unknown as { words: InputEntry[] }).words,
    );
    const improvedSrtData = await improveTextQuality(srtData);
    const grouped = groupLines(improvedSrtData);
    const result = formatSRT(grouped);
    const fileNameWithExtension = uploadURL.split('/').pop()!.split('?')[0];
    const fileNameWithoutExtension = fileNameWithExtension.split('.').slice(0, -1).join('.');
    const outputURLs: { [key: string]: string } = {};
    outputURLs["txt"] = await uploadOutputToBlob(`${fileNameWithoutExtension}_output.txt`, description, "txt");
    outputURLs["srt"] = await uploadOutputToBlob(`${fileNameWithoutExtension}_output.srt`, result, "srt");

    // Parse the JSON response once and convert to different formats
    /*const transcriptionData = response;
    const fileNameWithExtension = uploadURL.split('/').pop()!.split('?')[0];
    const fileNameWithoutExtension = fileNameWithExtension.split('.').slice(0, -1).join('.');

    const txtContent = convertToTXT(transcriptionData);
    const jsonContent = JSON.stringify(transcriptionData, null, 2);
    const srtContent = convertToSRT(transcriptionData);
    const vttContent = convertToVTT(transcriptionData);
    const tsvContent = convertToTSV(transcriptionData);

    // Output URLs for all files
    const outputURLs: { [key: string]: string } = {};

    // Upload each file to Blob Storage
    outputURLs["txt"] = await uploadOutputToBlob(`${fileNameWithoutExtension}_output.txt`, txtContent, "txt");
    outputURLs["json"] = await uploadOutputToBlob(`${fileNameWithoutExtension}_output.json`, jsonContent, "json");
    outputURLs["srt"] = await uploadOutputToBlob(`${fileNameWithoutExtension}_output.srt`, srtContent, "srt");
    outputURLs["vtt"] = await uploadOutputToBlob(`${fileNameWithoutExtension}_output.vtt`, vttContent, "vtt");
    outputURLs["tsv"] = await uploadOutputToBlob(`${fileNameWithoutExtension}_output.tsv`, tsvContent, "tsv");
    //await uploadOutputToBlob(outputFileName, response.text);*/
    return response.text;
  } catch (error) {
    console.error('Error during transcription::', error);
    throw new Error('Transcription failed.');
  }
};

async function uploadOutputToBlob(blobName: string, content: string, format: string): Promise<string> {
  const storageURLString: string = process.env.AZURE_BLOB_STORAGE_NAME || "";

  const blobServiceClient = BlobServiceClient.fromConnectionString(storageURLString);
  const containerName = 'transcribecontainer';
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Set content type based on the file format
  const contentTypeMap: { [key: string]: string } = {
    "txt": "text/plain",
    "json": "application/json",
    "srt": "application/x-subrip",
    "vtt": "text/vtt",
    "tsv": "text/tab-separated-values"
  };

  const uploadResponse = await blockBlobClient.upload(content, content.length, {
    blobHTTPHeaders: { blobContentType: contentTypeMap[format] || 'text/plain' },
  });

  console.log(`Upload successful. Request ID: ${uploadResponse.requestId}`);
  console.log(`Upload successful. URL: ${blockBlobClient.url}`);
  return blockBlobClient.url;
}

function convertToTXT(transcriptionData: any): string {
  return transcriptionData.words.map((word: any) => word.word).join(' ');
}

function convertToSRT(transcriptionData: any): string {
  let srtContent = '';
  transcriptionData.words.forEach((word: any, index: number) => {
    const startTime = formatTime(word.start);
    const endTime = formatTime(word.end);
    srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${word.word}\n\n`;
  });
  return srtContent;
}

function convertToVTT(transcriptionData: any): string {
  let vttContent = 'WEBVTT\n\n';
  transcriptionData.words.forEach((word: any, index: number) => {
    const startTime = formatTime(word.start);
    const endTime = formatTime(word.end);
    vttContent += `${index + 1}\n${startTime} --> ${endTime}\n${word.word}\n\n`;
  });
  return vttContent;
}

function convertToTSV(transcriptionData: any): string {
  let tsvContent = 'Start Time\tEnd Time\tText\n';
  transcriptionData.words.forEach((word: any) => {
    tsvContent += `${word.start}\t${word.end}\t${word.word}\n`;
  });
  return tsvContent;
}

function formatTime(timeInSeconds: number): string {
  const date = new Date(0);
  date.setSeconds(timeInSeconds);
  return date.toISOString().substr(11, 12).replace('.', ',');  // HH:MM:SS,MS
}