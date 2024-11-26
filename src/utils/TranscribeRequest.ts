import type { Transcriptions } from "$data/models/tenant.model";

export interface TranscribeRequest {
  folderName: string;
  fileName: string;
  uniqueName: string;
  uploadUrl: string;
  transcriptions: Transcriptions,
  transcriptionType?: TranscriptionType;
  selectedFileFormat?: FileFormat[];
  isShowImprovedTextPreview?: boolean,
  encryptedApiKey?: string;
  azureOpenAIInstanceName?: string;
  azureOpenAIEndpoint?: string;
  azureOpenAIWhisperModel?: string;
  azureOpenAIChatModel?: string;
  azureOpenAIApiKey?: string;
  audioBuffer?: Buffer;
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
}