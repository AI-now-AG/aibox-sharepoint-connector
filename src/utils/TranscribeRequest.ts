export interface TranscribeRequest {
  folderName: string;
  fileName: string;
  uniqueName: string;
  uploadUrl: string;
  instructionSubtitle?: string;
  instructionPlaintext?: string;
  encryptedApiKey?: string;
  azureOpenAIInstanceName?: string;
  azureOpenAIEndpoint?: string;
  azureOpenAIWhisperModel?: string;
  azureOpenAIChatModel?: string;
  azureOpenAIApiKey?: string;
  audioBuffer?: Buffer;
}

