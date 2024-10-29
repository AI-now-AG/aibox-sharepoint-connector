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

const DEFAULT_WHISPER_MODEL_NAME = "whisper-1";
const DEFAULT_API_VERSION = "2024-08-01-preview";
const DEFAULT_CHAT_MODE_NAME = "gpt-4o";

const DEFAULT_INSTRUCTIONS = `
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
`;

function getClient(requestParams: any) {
  const { azureOpenAIApiKey, azureOpenAIEndpoint, azureOpenAIWhisperModel } =
    requestParams;

  const endpoint = azureOpenAIEndpoint || process.env.AZURE_ENDPOINT;
  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || DEFAULT_API_VERSION;
  const deploymentName =
    azureOpenAIWhisperModel ||
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME ||
    DEFAULT_WHISPER_MODEL_NAME;

  return new AzureOpenAI({
    endpoint,
    apiKey: azureOpenAIApiKey,
    apiVersion,
    deployment: deploymentName,
  });
}

function getAzureChatModel(requestParams: any) {
  const { azureOpenAIApiKey, azureOpenAIInstanceName, azureOpenAIChatModel } =
    requestParams;

  const azureChatConfig = {
    azureOpenAIApiKey,
    azureOpenAIApiInstanceName:
      azureOpenAIInstanceName || process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName:
      azureOpenAIChatModel ||
      process.env.AZURE_CHAT_OPENAI_DEPLOYMENT_NAME ||
      DEFAULT_CHAT_MODE_NAME,
    azureOpenAIApiVersion:
      process.env.AZURE_OPENAI_API_VERSION || DEFAULT_API_VERSION,
  };

  return new AzureChatOpenAI(azureChatConfig);
}

async function getAzureResponse(requestParams: any, prompt: string) {
  try {
    const chat = getAzureChatModel(requestParams);
    const response = await chat.invoke(prompt);
    return response;
  } catch (error) {
    console.error("Error communicating with Azure OpenAI:", error);
    throw error;
  }
}

export const improveTextQuality = async (requestParams: any, data: Entry[]) => {
  const { instructions } = requestParams;

  const model = getAzureChatModel(requestParams);
  const flat = data
    .map(
      (entry) => `input> ${entry.text}
output> 
`,
    )
    .join("\n");

  const finalInstructions = instructions || DEFAULT_INSTRUCTIONS;
  console.log("finalInstructions", finalInstructions);
  const response = await model.invoke(
    [new SystemMessage(finalInstructions), new HumanMessage(flat)],
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
  requestParams: any,
): Promise<string> {
  try {
    const { audioBuffer, fileName, uploadUrl } = requestParams;

    console.log("uploadUrl", uploadUrl);
    const openaiClient = getClient(requestParams);
    const audioFile = await toFile(audioBuffer, fileName);

    const response = await openaiClient.audio.transcriptions.create({
      file: audioFile,
      model: DEFAULT_WHISPER_MODEL_NAME,
      temperature: 0,
      timestamp_granularities: ["word"],
      response_format: "verbose_json",
    });
    const transcriptionResponse = await getAzureResponse(
      requestParams,
      response.text,
    );
    const parser = new StringOutputParser();
    const description = await parser.invoke(transcriptionResponse);
    const srtData = createSRTData(
      (response as unknown as { words: InputEntry[] }).words,
    );

    const improvedSrtData = await improveTextQuality(requestParams, srtData);
    const grouped = groupLines(improvedSrtData);
    const result = formatSRT(grouped);
    const fileNameWithExtension = uploadUrl.split("/").pop()!.split("?")[0];
    const fileNameWithoutExtension = fileNameWithExtension
      .split(".")
      .slice(0, -1)
      .join(".");
    const outputURLs: { [key: string]: string } = {};
    outputURLs["txt"] = await uploadOutputToBlob(
      `${fileNameWithoutExtension}.txt`,
      description,
      "txt",
    );
    outputURLs["srt"] = await uploadOutputToBlob(
      `${fileNameWithoutExtension}.srt`,
      result,
      "srt",
    );

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
