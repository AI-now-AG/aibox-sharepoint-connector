import { BlobServiceClient } from "@azure/storage-blob";
import { AzureChatOpenAI, ChatOpenAI, toFile } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { OpenAI, AzureOpenAI, RateLimitError } from "openai";
import UsageLogModel, { type UsageLog } from "$data/models/usageLog.model";

import {
  groupLines,
  formatSRT,
  formatASS,
  createSRTData,
  createSRTDataLarge,
  type InputEntry,
  type Entry,
} from "./srt";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  type TranscribeRequest,
  type TranscriptionResult,
  type TranscribeResponse,
  FileFormat,
} from "$types/TranscribeRequest";
import { processTranscription } from "./batchTranscription";
import type { TranscriptionResponse } from "$utils/Speech/SpeechResponse";
import { ApiKeyProvider, AudioCategory, AzureTTSModel } from "$types/TenantFeature";
import { LoggingCallbackHandler } from "$callbackLLM/LoggingCallbackHandler";
import TranscriptionModel from "$data/models/transcription.model";
import { ElevenLabsClient } from "elevenlabs";
import { UsageType } from "$types/UsageTracking";
import { transcriptionCallbackHandler } from "./transcriptionCallback";
import { ObjectId } from "mongodb";

const DEFAULT_WHISPER_MODEL_NAME = "whisper-1";
const DEFAULT_API_VERSION = "2024-08-01-preview";
const DEFAULT_CHAT_MODE_NAME = "gpt-4o";
const DEFAULT_ELEVENLABS_MODEL_NAME = "scribe_v1";

const DEFAULT_INSTRUCTION = `
  You are a language expert. Your task is to review subtitles from a transcribed audio and identify potential misinterpretations while fixing missing punctuation. Improve all obvious errors and make illogical sentences logical. You must correct these while maintaining the original format as much as possible.

  In some cases the provided text was transcribed from Swiss German, you need to consider this, identify and correct misinterpreted Swiss German words. 
  
  Important guidelines:
  
  - Maintain the word count and line count of the original subtitle as much as possible
  - Add missing punctuation, such as periods, commas, or dashes
  - Keep the original meaning but aim for brevity without losing context
  - Use context clues to correct misinterpreted words
  - If the context is unclear, do not make assumptions; leave the original text unchanged.
  
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

function getElevenLabsClient() {
  return new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });
}

function getClient(transcribeParams: TranscribeRequest) {
  const endpoint =
    transcribeParams.azureOpenAIEndpoint || process.env.AZURE_ENDPOINT;
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

function getOpenAIChatModel(transcribeParams: TranscribeRequest) {
  const { openAIApiKey } = transcribeParams;
  const openaiChatConfig = {
    openAIApiKey,
    model: process.env.OPENAI_MODEL,
    callbacks: [
      new LoggingCallbackHandler(
        transcribeParams.tenantId,
        transcribeParams.userId,
        transcribeParams.fileName,
        ApiKeyProvider.OpenAI,
        process.env.OPENAI_MODEL ?? "",
      ),
    ],
    tags: ["transcribe", "improve", "text", "quality", "openai"],
  };
  return new ChatOpenAI(openaiChatConfig);
}

function getAzureChatModel(transcribeParams: TranscribeRequest) {
  const { azureOpenAIApiKey, azureOpenAIInstanceName, azureOpenAIChatModel } =
    transcribeParams;
  const modelName =
    azureOpenAIChatModel ||
    process.env.AZURE_CHAT_OPENAI_DEPLOYMENT_NAME ||
    DEFAULT_CHAT_MODE_NAME;
  const azureChatConfig = {
    azureOpenAIApiKey,
    azureOpenAIApiInstanceName:
      azureOpenAIInstanceName || process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName: modelName,
    azureOpenAIApiVersion:
      process.env.AZURE_OPENAI_API_VERSION || DEFAULT_API_VERSION,
    callbacks: [
      new LoggingCallbackHandler(
        transcribeParams.tenantId,
        transcribeParams.userId,
        transcribeParams.fileName,
        ApiKeyProvider.AzureOpenAI,
        modelName,
      ),
    ],
    tags: ["transcribe", "improve", "text", "quality", "azure"],
  };

  return new AzureChatOpenAI(azureChatConfig);
}

export const improveSRTQuality = async (
  transcribeParams: TranscribeRequest,
  data: Entry[],
) => {
  let model = getOpenAIChatModel(transcribeParams);
  if (transcribeParams.apiKeyProvider === ApiKeyProvider.AzureOpenAI) {
    model = getAzureChatModel(transcribeParams);
  }

  /*const flatEntries = data
    .map(
      (entry) => `input> ${entry.text}
output> 
`,
    )
    .join("\n");*/

  let instruction = DEFAULT_INSTRUCTION;
  if (transcribeParams.usecaseId) {
    const transcription = await TranscriptionModel.get(
      transcribeParams.usecaseId,
    );
    instruction = transcription?.text ?? DEFAULT_INSTRUCTION;
  }

  const CHUNK_SIZE_TOKENS = 9000;

  const textChunks: string[] = [];
  let currentChunk = "";
  let currentTokenCount = 0;

  for (const entry of data) {
    const formattedText = `input> ${entry.text}\noutput> \n\n`;
    const tokens = formattedText.length / 4;

    if (
      currentTokenCount + tokens > CHUNK_SIZE_TOKENS &&
      currentChunk.length > 0
    ) {
      textChunks.push(currentChunk);
      currentChunk = "";
      currentTokenCount = 0;
    }

    currentChunk += formattedText;
    currentTokenCount += tokens;
  }

  if (currentChunk.length > 0) {
    textChunks.push(currentChunk);
  }

  const correctedLines: string[] = [];
  let previousResponse = "";

  for (const chunk of textChunks) {
    const response = await model.invoke([
      new SystemMessage(instruction || DEFAULT_INSTRUCTION),
      new HumanMessage(
        (previousResponse
          ? previousResponse +
            `\n\n[Continue improving from where you left off. Do not repeat previous outputs.]\n\n`
          : "") + chunk,
      ),
    ]);

    const chunkResult = response.content
      .toString()
      .split("\n")
      .filter((line) => line.startsWith("output>"))
      .map((line) => line.substring(8));

    correctedLines.push(...chunkResult);
    previousResponse += chunkResult.join("\n") + "\n";
  }

  return data.map((entry, i) => ({
    ...entry,
    text: correctedLines[i] || entry.text,
  }));
};

export const improveTextQuality = async (
  transcribeParams: TranscribeRequest,
  text: string,
  instruction?: string,
) => {
  let model = getOpenAIChatModel(transcribeParams);
  if (transcribeParams.apiKeyProvider === ApiKeyProvider.AzureOpenAI) {
    model = getAzureChatModel(transcribeParams);
  }
  const finalInstructions = instruction || DEFAULT_INSTRUCTION;
  const response3 = await model.invoke(
    [new SystemMessage(finalInstructions), new HumanMessage(text)],
    {},
  );

  const parser = new StringOutputParser();
  const correctedText = await parser.invoke(response3);
  /*const correctedText = response3.content
    .toString()
    .split("\n")
    .find((line) => line.startsWith("output>"))?.substring(8) || text;*/
  return correctedText;
};

function bufferToTranscribeResponse(buffer: Buffer): TranscribeResponse {
  try {
    const jsonString = buffer.toString("utf-8");
    const parsedData: TranscribeResponse = JSON.parse(jsonString);
    if (
      !parsedData.task ||
      !parsedData.language ||
      !parsedData.duration ||
      !parsedData.text ||
      !Array.isArray(parsedData.words)
    ) {
      throw new Error("Invalid TranscribeResponse structure");
    }

    return parsedData;
  } catch (error) {
    console.error("Error converting buffer to TranscribeResponse:", error);
    throw new Error("Failed to parse buffer into TranscribeResponse");
  }
}

export async function transcribeUsingOpenAI(
  transcribeParams: TranscribeRequest,
): Promise<TranscriptionResult> {
  try {
    const { category, isAudioTagEnabled, audioBuffer, fileName } =
      transcribeParams;

    let openaiClient: OpenAI | AzureOpenAI | ElevenLabsClient;
    if (category === AudioCategory.Subtitle11Labs) {
      openaiClient = getElevenLabsClient();
    } else {
      openaiClient = getClient(transcribeParams);
    }

    if (!audioBuffer) {
      throw new Error("Audio buffer is missing or undefined.");
    }

    const modelName = category === AudioCategory.Subtitle11Labs ? AzureTTSModel.ElevenLabs :
      transcribeParams.azureOpenAIWhisperModel ||
      process.env.AZURE_OPENAI_DEPLOYMENT_NAME ||
      DEFAULT_WHISPER_MODEL_NAME;
    const provider = category === AudioCategory.Subtitle11Labs
      ? ApiKeyProvider.ElevenLabs : ApiKeyProvider.AzureOpenAI

    // let response: TranscriptionVerbose | TranscribeResponse | SpeechToTextChunkResponseModel | null = null;
    let response: any = null;
    if (category === AudioCategory.SubtitleJson) {
      const jsonResponse = bufferToTranscribeResponse(audioBuffer);
      response = jsonResponse;
    } else {
      const audioFile = await toFile(audioBuffer, fileName);
      if (
        openaiClient instanceof OpenAI ||
        openaiClient instanceof AzureOpenAI
      ) {
        console.log("\n\nwhisper\n\n");
        response = await openaiClient.audio.transcriptions.create({
          file: audioFile,
          model: DEFAULT_WHISPER_MODEL_NAME,
          temperature: 0,
          timestamp_granularities: ["word"],
          response_format: "verbose_json",
        });
      } else {
        console.log("\n\nelevenLabs\n\n");
        const startTime = Date.now(); // Get start time in milliseconds
        const Audioblob = new Blob([audioBuffer]);
        const eleventLabResponse = await openaiClient.speechToText.convert({
          enable_logging: true,
          model_id: DEFAULT_ELEVENLABS_MODEL_NAME,
          file: Audioblob,
        });
        
        // Get audio duration from the last word's end time
        const lastWord = eleventLabResponse.words[eleventLabResponse.words.length - 1];
        const duration = lastWord ? lastWord.end || 0 : 0;
        
        // Get usage metrics for monitoring purposes
        const usageMetrics = await openaiClient.usage.getCharactersUsageMetrics({
          start_unix: startTime,
          end_unix: Date.now()
        });
        
        // Log the usage metrics and duration for monitoring
        console.log('ElevenLabs Usage Metrics:', JSON.stringify(usageMetrics, null, 2));
        console.log('Audio Duration in seconds:', duration);
        
        const excludeTypes = ["spacing"];
        if (!isAudioTagEnabled) {
          excludeTypes.push("audio_event");
        }
        
        const filteredWords = eleventLabResponse.words.filter(
          (word) => !excludeTypes.includes(word.type),
        );
        
        const cleanedWords = filteredWords.map(
          ({ text, start, end }) => ({
            word: text,
            start: start || 0,
            end: end || 0,
          }),
        );

        // Format response to match TranscribeResponse interface
        response = {
          task: "transcribe",
          language: eleventLabResponse.language_code || "en",
          duration: duration,
          text: eleventLabResponse.text,
          words: cleanedWords
        };
      }
      if (response) {
        transcriptionCallbackHandler.emit("transcriptionCompleted", {
          duration: response.duration,
          tenantId: transcribeParams.tenantId,
          deploymentModel: modelName,
          category: category || AudioCategory.AudioToText,
          provider: provider,
        });
      }
    }
    const transcriptionText = response?.text ?? "";
    const parser = new StringOutputParser();
    const description = await parser.invoke(transcriptionText);

    let improvedText = description;

    const fileNameWithExtension = transcribeParams.uploadUrl
      .split("/")
      .pop()!
      .split("?")[0];
    const fileNameWithoutExtension = fileNameWithExtension
      .split(".")
      .slice(0, -1)
      .join(".");
    const outputURLs: { [key: string]: string } = {};
    if (category !== AudioCategory.SubtitleJson) {
      outputURLs["json"] = await uploadOutputToBlob(
        transcribeParams.folderName,
        `${fileNameWithoutExtension}.json`,
        JSON.stringify(response),
        "json",
      );
    }
    if (category === AudioCategory.AudioToText) {
      if (transcribeParams.usecaseId) {
        const transcription = await TranscriptionModel.get(
          transcribeParams.usecaseId,
        );
        const instruction = transcription?.text;
        if (instruction) {
          improvedText = await improveTextQuality(
            transcribeParams,
            description,
            instruction,
          );
        }
      }
    } else if (
      category === AudioCategory.Subtitle ||
      category === AudioCategory.SubtitleJson ||
      category === AudioCategory.Subtitle11Labs
    ) {
      const jsonData = response as unknown as { words: InputEntry[] };
      await uploadSubtitleFiles(
        transcribeParams.selectedFileFormat,
        transcribeParams.isShowImprovedTextPreview,
        transcribeParams.folderName,
        fileNameWithoutExtension,
        jsonData,
        outputURLs,
        category,
        transcribeParams,
      );
    }

    outputURLs["txt"] = await uploadOutputToBlob(
      transcribeParams.folderName,
      `${fileNameWithoutExtension}.txt`,
      improvedText,
      "txt",
    );

    return {
      success: true,
      data: { text: transcriptionText, urls: outputURLs },
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

export async function transcribeUsingAzureOpenAI(
  transcribeParams: TranscribeRequest,
): Promise<TranscriptionResult> {
  try {
    const maxNumberOfSpeakers = transcribeParams.maxSpeakers ?? 2;
    const speechKey =
      transcribeParams.speechKey ?? process.env.AZURE_LARGE_SPEECH_KEY!;
    const speechRegion =
      transcribeParams.speechRegion ?? process.env.AZURE_LARGE_SPEECH_REGION!;
    // const { jsonData, transcriptionText } = await processTranscription(
    const { transcriptionText } = await processTranscription(
      transcribeParams.uploadUrl,
      transcribeParams.uniqueName,
      speechKey,
      speechRegion,
      transcribeParams.isDiarizationEnabled,
      maxNumberOfSpeakers,
      transcribeParams.category,
      transcribeParams.languageLocales,
    );
    const outputURLs: { [key: string]: string } = {};
    /*const outputURLs = await uploadLargeFile(
      transcribeParams.uploadUrl,
      transcribeParams.folderName,
      jsonData,
      transcriptionText,
    );*/

    return {
      success: true,
      data: { text: transcriptionText, urls: outputURLs },
      error: null,
    };
  } catch (error) {
    console.error("Error during batch transcription::", error);
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

export async function uploadLargeFile(
  uploadUrl: string,
  folderName: string,
  jsonData: TranscriptionResponse,
  transcriptionText: string,
  tenantId: string,
): Promise<{ [key: string]: string }> {
  transcriptionCallbackHandler.emit("transcriptionCompleted", {
    duration: jsonData.durationMilliseconds
      ? jsonData.durationMilliseconds
      : jsonData.durationInTicks / 10000,
    tenantId: tenantId,
    deploymentModel: "Audio Pro",
    category: AudioCategory.AudioPro,
    provider: ApiKeyProvider.AzureOpenAI,
  });
  const fileNameWithExtension = uploadUrl.split("/").pop()!.split("?")[0];
  const fileNameWithoutExtension = fileNameWithExtension
    .split(".")
    .slice(0, -1)
    .join(".");
  const outputURLs: { [key: string]: string } = {};

  outputURLs["json"] = await uploadOutputToBlob(
    folderName,
    `${fileNameWithoutExtension}.json`,
    JSON.stringify(jsonData),
    "json",
    AudioCategory.AudioPro,
  );
  outputURLs["txt"] = await uploadOutputToBlob(
    folderName,
    `${fileNameWithoutExtension}.txt`,
    transcriptionText,
    "txt",
    AudioCategory.AudioPro,
  );
  return outputURLs;
}

async function uploadSubtitleFiles(
  selectedFileFormat: FileFormat[] | undefined,
  isShowImprovedTextPreview: boolean = false,
  folderName: string,
  fileNameWithoutExtension: string,
  jsonData: { words: InputEntry[] },
  outputURLs: { [key: string]: string },
  category?: AudioCategory,
  transcribeParams?: TranscribeRequest,
) {
  let srtData: Entry[] = [],
    improvedSrtData: Entry[] = [],
    grouped: Entry[] = [];
  const fileFormats = selectedFileFormat ?? [];

  if (
    fileFormats.includes(FileFormat.SRT) ||
    fileFormats.includes(FileFormat.ASS) ||
    isShowImprovedTextPreview
  ) {
    srtData = createSRTData(jsonData.words);
    improvedSrtData = srtData;
    if (transcribeParams) {
      improvedSrtData = await improveSRTQuality(transcribeParams!, srtData);
    }
    grouped = groupLines(improvedSrtData);
    if (isShowImprovedTextPreview) {
      const improvedTextGroup = grouped.map((item) => item.text).join("\n\n");
      outputURLs["txt_improved"] = await uploadOutputToBlob(
        folderName,
        `${fileNameWithoutExtension}_improved.txt`,
        improvedTextGroup,
        "txt",
        category,
      );
    }
  }
  if (selectedFileFormat && selectedFileFormat?.includes(FileFormat.SRT)) {
    const srtResult = formatSRT(grouped);
    outputURLs["srt"] = await uploadOutputToBlob(
      folderName,
      `${fileNameWithoutExtension}.srt`,
      srtResult,
      "srt",
      category,
    );
  }
  if (selectedFileFormat && selectedFileFormat?.includes(FileFormat.ASS)) {
    const assResult = formatASS(grouped);
    outputURLs["ass"] = await uploadOutputToBlob(
      folderName,
      `${fileNameWithoutExtension}.ass`,
      assResult,
      "ass",
      category,
    );
  }
}

export async function uploadSubtitleLargeFiles(
  uploadUrl: string,
  folderName: string,
  jsonData: TranscriptionResponse,
  transcriptionText: string,
  selectedFileFormat: FileFormat[] | undefined,
  isShowImprovedTextPreview: boolean = false,
  transcribeParams: TranscribeRequest,
): Promise<{ [key: string]: string }> {
  console.log("data processinnng...");
  transcriptionCallbackHandler.emit("transcriptionCompleted", {
    duration: jsonData.durationMilliseconds
      ? jsonData.durationMilliseconds
      : jsonData.durationInTicks / 10000,
    tenantId: transcribeParams.tenantId,
    deploymentModel: "Audio Pro",
    category: transcribeParams.category || AudioCategory.SubtitleLarge,
    provider: ApiKeyProvider.AzureOpenAI,
  });
  const outputURLs: { [key: string]: string } = {};
  const fileNameWithExtension = uploadUrl.split("/").pop()!.split("?")[0];
  const fileNameWithoutExtension = fileNameWithExtension
    .split(".")
    .slice(0, -1)
    .join(".");

  const displayWords = jsonData.recognizedPhrases
    .filter((phrase) => phrase.channel === 0)
    .map((phrase) => {
      const bestMatch = phrase.nBest.reduce((best, current) => {
        return current.confidence > best.confidence ? current : best;
      });
      return bestMatch;
    })
    .flatMap((n) => n.displayWords ?? []);
  const formattedWords = createSRTDataLarge(displayWords);
  await uploadSubtitleFiles(
    selectedFileFormat,
    isShowImprovedTextPreview,
    folderName,
    fileNameWithoutExtension,
    formattedWords,
    outputURLs,
    AudioCategory.SubtitleLarge,
    transcribeParams,
  );

  outputURLs["json"] = await uploadOutputToBlob(
    folderName,
    `${fileNameWithoutExtension}.json`,
    JSON.stringify(jsonData),
    "json",
    AudioCategory.SubtitleLarge,
  );

  outputURLs["txt"] = await uploadOutputToBlob(
    folderName,
    `${fileNameWithoutExtension}.txt`,
    transcriptionText,
    "txt",
    AudioCategory.SubtitleLarge,
  );
  return outputURLs;
}

transcriptionCallbackHandler.on("transcriptionCompleted", async (response) => {
  try {
    const { duration, tenantId, deploymentModel, category, provider } = response;

    const tenantIdObjId = ObjectId.isValid(tenantId)
      ? new ObjectId(tenantId)
      : new ObjectId();

    const usage: Partial<Omit<UsageLog, "_id">> = {
      tenant_id: tenantIdObjId,
      provider: provider,
      category: category,
      model: deploymentModel,
      type: UsageType.Transcription,
      duration: duration,
    };

    await UsageLogModel.create(usage);
  } catch (error) {
    console.log("error:::::", error);
  }
});

async function uploadOutputToBlob(
  folderName: string,
  blobName: string,
  content: string,
  format: string,
  category?: AudioCategory,
): Promise<string> {
  const storageURLString =
    category === AudioCategory.AudioPro ||
    category === AudioCategory.SubtitleLarge
      ? process.env.AZURE_BLOB_LARGE_STORAGE_NAME || ""
      : process.env.AZURE_BLOB_STORAGE_NAME || "";
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(storageURLString);
  const containerName =
    category === AudioCategory.AudioPro ||
    category === AudioCategory.SubtitleLarge
      ? process.env.AZURE_LARGE_CONTAINER_NAME || "transcribe-container"
      : process.env.AZURE_CONTAINER_NAME || "transcribecontainer";
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
