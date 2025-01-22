import type { Transcriptions } from "$data/models/tenant.model";
import { ApiKeyProvider } from "$types/TenantFeature";

export interface TranscribeRequest {
  folderName: string;
  fileName: string;
  uniqueName: string;
  uploadUrl: string;
  transcriptions: Transcriptions;
  tenantId: string;
  userId: string;
  transcriptionType?: TranscriptionType;
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
}

export enum FileFormat {
  ASS = "ass",
  SRT = "srt",
  JSON = "json",
  TXT = "txt",
}
export enum TranscriptionType {
  Plaintext = "plaintext",
  Summarize = "summary",
  Subtitles = "subtitles",
  Largefile = "largefile",
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
