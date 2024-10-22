import { BlobServiceClient } from "@azure/storage-blob";
import { AzureChatOpenAI, toFile } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AzureOpenAI } from "openai";
import {
  groupLines,
  formatSRT,
  createSRTData,
  type InputEntry,
  type Entry,
} from "./srt";
import { StringOutputParser } from "@langchain/core/output_parsers";

const MODEL_NAME = "whisper-1";

const instructions = new SystemMessage(`
  You are a Swiss German language expert. Your task is to review German subtitles and identify potential misinterpretations of Swiss German words, particularly place names, with a focus on the canton Graubünden while fixing missing punctuation. You must correct these while maintaining the original format as much as possible.
  Important guidelines:
  
  - Maintain the exact word count and line count of the original subtitle.
  - Maintain the exact character count, except when fixing punctuation.
  - Focus on identifying and correcting misinterpreted Swiss German words.
  - Use context clues to determine if a word is likely a misinterpretation.
  - For Swiss German dialect words that are correctly used, leave them as
  - Apply corrections consistently throughout the text.
  - For ambiguous cases, preserve the original text
  - If no changes are needed, use the exact input as output.
  - Do NOT guess or improvise if the context is unclear. Stick to the information provided in the subtitles.
  
  Remember, your primary goal is to identify and correct misinterpreted Swiss German words while preserving the original format of the subtitle file as much as possible, with the exception of punctuation fixes.
  
  The user will provide a batch of subtitle lines. You should respond with the corrected version, highlighting any changes made.
  
  Example Input:
  
  input> Wir fahren morgen nach Kur um uns
  output> 
  
  input> Sanierung einer Strasse ob Schwanden
  output> 
  
  input> hatte keinen Einfluss auf den
  output> 
  
  input> Erdrutsch Ende August 2023 Zu diesem
  output> 
  
  input> Untersuchung die die
  output> 
  
  input> die Ergebnisse präsentiert
  output> 
  
  Expected Output:
  
  input> Wir fahren morgen nach Kur um uns
  output> Wir fahren morgen nach Chur, um uns
  
  input> Sanierung einer Strasse ob Schwanden
  output> Sanierung einer Strasse in Schwanden
  
  input> hatte keinen Einfluss auf den
  output> hatte keinen Einfluss auf den
  
  input> Erdrutsch Ende August 2023 Zu diesem
  output> Erdrutsch Ende August 2023. Zu diesem
  
  input> Untersuchung die die
  output> Untersuchung, die die
  
  input> die Ergebnisse präsentiert
  output> die Ergebnisse präsentiert.
`);

function getClient(azureOpenAIApiKey: string) {
  const endpoint = process.env.AZURE_ENDPOINT;
  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";
  const deploymentName =
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "whisper-1";

  return new AzureOpenAI({
    endpoint,
    apiKey: azureOpenAIApiKey,
    apiVersion,
    deployment: deploymentName,
  });
}

function getAzureChatModel(azureOpenAIApiKey: string) {
  const azureChatConfig = {
    azureOpenAIApiKey,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName:
      process.env.AZURE_CHAT_OPENAI_DEPLOYMENT_NAME || "gpt-4o",
    azureOpenAIApiVersion:
      process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview",
  };

  return new AzureChatOpenAI(azureChatConfig);
}

async function getAzureResponse(azureOpenAIApiKey: string, prompt: string) {
  try {
    const chat = getAzureChatModel(azureOpenAIApiKey);

    const response = await chat.invoke(prompt);
    return response;
  } catch (error) {
    console.error("Error communicating with Azure OpenAI:", error);
    throw error;
  }
}

export const improveTextQuality = async (
  azureOpenAIApiKey: string,
  data: Entry[],
) => {
  const model = getAzureChatModel(azureOpenAIApiKey);
  const flat = data
    .map(
      (entry) => `input> ${entry.text}
output> 
`,
    )
    .join("\n");

  const response = await model.invoke(
    [instructions, new HumanMessage(flat)],
    {},
  );

  const correctedLines = response.content
    .toString()
    .split("\n")
    .filter((line) => line.startsWith("output>"))
    .map((line) => line.substring(8));

  const out = data.map((entry, i) =>
    Object.assign({}, entry, { text: correctedLines[i] }),
  );

  return out;
};

export async function transcribeUsingOpenAI(
  audioBuffer: Buffer,
  fileName: string,
  audioMimeType: string | null,
  uploadURL: string,
  azureOpenAIApiKey: string,
): Promise<string> {
  try {
    console.log(uploadURL);
    const openaiClient = getClient(azureOpenAIApiKey);
    //const tempFilePath = join("/tmp", fileName);
    //writeFileSync(tempFilePath, audioBuffer);
    //const audioFileStream = createReadStream(tempFilePath);

    const audioFile = await toFile(audioBuffer, fileName);

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
    const transcriptionResponse = await getAzureResponse(
      azureOpenAIApiKey,
      response.text,
    );
    const parser = new StringOutputParser();
    const description = await parser.invoke(transcriptionResponse);
    const srtData = createSRTData(
      (response as unknown as { words: InputEntry[] }).words,
    );
    console.log("srtData", srtData);

    const improvedSrtData = await improveTextQuality(
      azureOpenAIApiKey,
      srtData,
    );
    const grouped = groupLines(improvedSrtData);
    const result = formatSRT(grouped);
    const fileNameWithExtension = uploadURL.split("/").pop()!.split("?")[0];
    const fileNameWithoutExtension = fileNameWithExtension
      .split(".")
      .slice(0, -1)
      .join(".");
    const outputURLs: { [key: string]: string } = {};
    outputURLs["txt"] = await uploadOutputToBlob(
      `${fileNameWithoutExtension}_output.txt`,
      description,
      "txt",
    );
    outputURLs["srt"] = await uploadOutputToBlob(
      `${fileNameWithoutExtension}_output.srt`,
      result,
      "srt",
    );

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
    console.error("Error during transcription::", error);
    throw new Error("Transcription failed.");
  }
}

async function uploadOutputToBlob(
  blobName: string,
  content: string,
  format: string,
): Promise<string> {
  const storageURLString: string = process.env.AZURE_BLOB_STORAGE_NAME || "";

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(storageURLString);
  const containerName =
    process.env.AZURE_CONTAINER_NAME || "transcribecontainer";
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Set content type based on the file format
  const contentTypeMap: { [key: string]: string } = {
    txt: "text/plain",
    json: "application/json",
    srt: "application/x-subrip",
    vtt: "text/vtt",
    tsv: "text/tab-separated-values",
  };

  const uploadResponse = await blockBlobClient.upload(content, content.length, {
    blobHTTPHeaders: {
      blobContentType: contentTypeMap[format] || "text/plain",
    },
  });

  console.log(`Upload successful. Request ID: ${uploadResponse.requestId}`);
  console.log(`Upload successful. URL: ${blockBlobClient.url}`);
  return blockBlobClient.url;
}

function convertToTXT(transcriptionData: any): string {
  return transcriptionData.words.map((word: any) => word.word).join(" ");
}

function convertToSRT(transcriptionData: any): string {
  let srtContent = "";
  transcriptionData.words.forEach((word: any, index: number) => {
    const startTime = formatTime(word.start);
    const endTime = formatTime(word.end);
    srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${word.word}\n\n`;
  });
  return srtContent;
}

function convertToVTT(transcriptionData: any): string {
  let vttContent = "WEBVTT\n\n";
  transcriptionData.words.forEach((word: any, index: number) => {
    const startTime = formatTime(word.start);
    const endTime = formatTime(word.end);
    vttContent += `${index + 1}\n${startTime} --> ${endTime}\n${word.word}\n\n`;
  });
  return vttContent;
}

function convertToTSV(transcriptionData: any): string {
  let tsvContent = "Start Time\tEnd Time\tText\n";
  transcriptionData.words.forEach((word: any) => {
    tsvContent += `${word.start}\t${word.end}\t${word.word}\n`;
  });
  return tsvContent;
}

function formatTime(timeInSeconds: number): string {
  const date = new Date(0);
  date.setSeconds(timeInSeconds);
  return date.toISOString().substr(11, 12).replace(".", ","); // HH:MM:SS,MS
}
