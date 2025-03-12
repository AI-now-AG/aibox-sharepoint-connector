import { ApiKeyProvider, AudioCategory } from "$types/TenantFeature";

export interface TranscribeRequest {
  folderName: string;
  fileName: string;
  uniqueName: string;
  uploadUrl: string;
  tenantId: string;
  userId: string;
  category?: AudioCategory;
  selectedFileFormat?: FileFormat[];
  isShowImprovedTextPreview?: boolean;
  apiKeyProvider?: ApiKeyProvider;
  openaiEncryptedApiKey?: string;
  encryptedApiKey?: string;
  azureOpenAIInstanceName?: string;
  azureOpenAIEndpoint?: string;
  azureOpenAIWhisperModel?: string;
  azureOpenAIChatModel?: string;
  azureOpenAIApiKey?: string;
  openAIApiKey?: string;
  encryptedSpeechKey?: string;
  speechKey?: string;
  speechRegion?: string;
  audioBuffer?: Buffer;
  isDiarizationEnabled?: boolean;
  maxSpeakers?: number;
  languageLocales?: string[];
  usecaseId?: string;
}

export enum FileFormat {
  ASS = "ass",
  SRT = "srt",
  JSON = "json",
  TXT = "txt",
}
export enum TranscriptionType {
  Plaintext = "plaintext",
  // Summarize = "summary",
  Subtitles = "subtitles",
  // Subtitlesjson = "subtitlesjson",
  Largefile = "largefile",
  // SubtitleLarge = "subtitlelarge",
}

export interface TranscriptionResult {
  success: boolean;
  data: {
    text: string;
    urls: {
      [key: string]: string;
    };
  } | null;
  error: string | null;
}

export interface TranscribeResponse {
  task: string;
  language: string;
  duration: number;
  text: string;
  words: Word[];
}

export interface Word {
  word: string;
  start: number;
  end: number;
}
