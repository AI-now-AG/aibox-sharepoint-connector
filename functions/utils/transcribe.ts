import { BlobServiceClient } from "@azure/storage-blob";
import { AzureChatOpenAI, toFile } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AzureOpenAI, RateLimitError } from "openai";

import {
  groupLines,
  formatSRT,
  formatASS,
  createSRTData,
  type InputEntry,
  type Entry,
} from "./srt";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { type TranscribeRequest, FileFormat, TranscriptionType } from "$utils/TranscribeRequest";

const DEFAULT_WHISPER_MODEL_NAME = "whisper-1";
const DEFAULT_API_VERSION = "2024-08-01-preview";
const DEFAULT_CHAT_MODE_NAME = "gpt-4o";

const DEFAULT_INSTRUCTION = `
  You are a Swiss German language expert. Your task is to review German subtitles and identify potential misinterpretations of Swiss German words, particularly place names, with a focus on the canton Graubünden while fixing missing punctuation. Improve all obvious errors in the following transcription, make illogical sentences logical. You must correct these while maintaining the original format as much as possible.
  
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

function getClient(transcribeParams: TranscribeRequest) {
  const endpoint = transcribeParams.azureOpenAIEndpoint || process.env.AZURE_ENDPOINT;
  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || DEFAULT_API_VERSION;
  const deploymentName =
    transcribeParams.azureOpenAIWhisperModel ||
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME ||
    DEFAULT_WHISPER_MODEL_NAME;

  return new AzureOpenAI({
    endpoint,
    apiKey: transcribeParams.azureOpenAIApiKey,
    apiVersion,
    deployment: deploymentName,
  });
}

function getAzureChatModel(transcribeParams: TranscribeRequest) {
  const { azureOpenAIApiKey, azureOpenAIInstanceName, azureOpenAIChatModel } = transcribeParams;

  const azureChatConfig = {
    azureOpenAIApiKey,
    azureOpenAIApiInstanceName: azureOpenAIInstanceName || process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName: azureOpenAIChatModel || process.env.AZURE_CHAT_OPENAI_DEPLOYMENT_NAME || DEFAULT_CHAT_MODE_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || DEFAULT_API_VERSION,
  };

  return new AzureChatOpenAI(azureChatConfig);
}

export const improveSRTQuality = async (transcribeParams: TranscribeRequest, data: Entry[]) => {
  const model = getAzureChatModel(transcribeParams);
  const flatEntries = data
    .map(
      (entry) => `input> ${entry.text}
output> 
`,
    )
    .join("\n");
  const chunks = [];
  let currentChunk = "";
  for (const entry of flatEntries) {
    const tokenCount = (currentChunk.length + entry.length) / 4;
    if (tokenCount >= 25000) {
      chunks.push(currentChunk);
      currentChunk = entry;
    } else {
      currentChunk += entry;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  let correctedLines = [];
  for (const chunk of chunks) {
    const response = await model.invoke([
      new SystemMessage(transcribeParams.transcriptions.subtitles?.text || DEFAULT_INSTRUCTION),
      new HumanMessage(chunk)
    ]);
    correctedLines.push(
      ...response.content.toString()
        .split("\n")
        .filter((line) => line.startsWith("output>"))
        .map((line) => line.substring(8))
    );
  }
  const out = data.map((entry, i) => ({
    ...entry,
    text: correctedLines[i] || entry.text,
  }));
  return out;
};

export const improveTextQuality = async (
  transcribeParams: TranscribeRequest,
  text: string,
  instruction?: string
) => {
  const model = getAzureChatModel(transcribeParams);
  const finalInstructions = instruction || DEFAULT_INSTRUCTION;
  const response3 = await model.invoke(
    [new SystemMessage(finalInstructions), new HumanMessage(text)],
    {}
  );

  const parser = new StringOutputParser();
  const correctedText = await parser.invoke(response3);
  /*const correctedText = response3.content
    .toString()
    .split("\n")
    .find((line) => line.startsWith("output>"))?.substring(8) || text;*/
  return correctedText;
};

export async function transcribeUsingOpenAI(transcribeParams: TranscribeRequest): Promise<{
  success: boolean;
  data: {
    text: string;
    urls: {
      [key: string]: string;
    };
  } | null;
  error: string | null;
}> {
  try {
    const { audioBuffer, fileName } = transcribeParams;

    const openaiClient = getClient(transcribeParams);
    if (!audioBuffer) {
      throw new Error("Audio buffer is missing or undefined.");
    }
    const audioFile = await toFile(audioBuffer, fileName);

    const response = await openaiClient.audio.transcriptions.create({
      file: audioFile,
      model: DEFAULT_WHISPER_MODEL_NAME,
      temperature: 0,
      timestamp_granularities: ["word"],
      response_format: "verbose_json",
    });

    const transcriptionText = response.text;
    const parser = new StringOutputParser();
    const description = await parser.invoke(transcriptionText);

    let improvedText = description

    const fileNameWithExtension = transcribeParams.uploadUrl.split("/").pop()!.split("?")[0];
    const fileNameWithoutExtension = fileNameWithExtension
      .split(".")
      .slice(0, -1)
      .join(".");
    const outputURLs: { [key: string]: string } = {};
    outputURLs["json"] = await uploadOutputToBlob(
      transcribeParams.folderName,
      `${fileNameWithoutExtension}.json`,
      JSON.stringify(response),
      "json",
    );

    if (transcribeParams.transcriptionType === TranscriptionType.Plaintext) {
      const instruction = transcribeParams.transcriptions.plaintext?.text
      if (instruction) {
        improvedText = await improveTextQuality(transcribeParams, description, instruction);
      }
    } else if (transcribeParams.transcriptionType === TranscriptionType.Summarize) {
      const instruction = transcribeParams.transcriptions.summary?.text
      if (instruction) {
        improvedText = await improveTextQuality(transcribeParams, description, instruction);
      }
    } else if (transcribeParams.transcriptionType === TranscriptionType.Subtitles) {
      let srtData: Entry[] = [], improvedSrtData: Entry[] = [], grouped: Entry[] = [];
      let fileFormats = transcribeParams.selectedFileFormat ?? [];
      if (fileFormats.includes(FileFormat.SRT) || fileFormats.includes(FileFormat.ASS) || transcribeParams.isShowImprovedTextPreview) {
        srtData = createSRTData(
          (response as unknown as { words: InputEntry[] }).words,
        );
        improvedSrtData = await improveSRTQuality(transcribeParams, srtData);
        grouped = groupLines(improvedSrtData);
        if (transcribeParams.isShowImprovedTextPreview) {
          const improvedTextGroup = grouped.map(item => item.text).join('\n\n');
          outputURLs["txt_improved"] = await uploadOutputToBlob(
            transcribeParams.folderName,
            `${fileNameWithoutExtension}_improved.txt`,
            improvedTextGroup,
            "txt",
          );
        }
      }
      if (transcribeParams.selectedFileFormat && transcribeParams.selectedFileFormat?.includes(FileFormat.SRT)) {
        const srtResult = formatSRT(grouped);
        outputURLs["srt"] = await uploadOutputToBlob(
          transcribeParams.folderName,
          `${fileNameWithoutExtension}.srt`,
          srtResult,
          "srt",
        );
      }
      if (transcribeParams.selectedFileFormat && transcribeParams.selectedFileFormat?.includes(FileFormat.ASS)) {
        const assResult = formatASS(grouped);
        outputURLs["ass"] = await uploadOutputToBlob(
          transcribeParams.folderName,
          `${fileNameWithoutExtension}.ass`,
          assResult,
          "ass",
        );
      }
    }

    outputURLs["txt"] = await uploadOutputToBlob(
      transcribeParams.folderName,
      `${fileNameWithoutExtension}.txt`,
      improvedText,
      "txt",
    );

    return {
      success: true,
      data: { text: response.text, urls: outputURLs },
      error: null,
    };
  } catch (error) {
    console.error("Error during transcription::", error);
    let errorMessage = "Transcription failed.";
    if (error instanceof RateLimitError) {
      errorMessage =
        "Rate limit exceeded. Please try again later or upgrade your plan.";
    } else if (
      typeof error === "object" &&
      error !== null &&
      "message" in error
    ) {
      errorMessage = error.message as string;
    }

    return { success: false, data: null, error: errorMessage };
  }
}

async function uploadOutputToBlob(
  folderName: string,
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
  const blobPath = `${folderName}/${blobName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

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
