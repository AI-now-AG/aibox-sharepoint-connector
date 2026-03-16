export enum UsageType {
  Text = "text",
  Image = "image",
  Transcription = "transcription",
  Speech = "speech",
  Websearch = "websearch",
  Embedding = "embedding",
}

export enum TextModel {
  Gpt4o = "gpt-4o",
  Gpt5 = "gpt-5.1",
  ClaudeSonnet = "claude-sonnet-4-6",
  Gemini = "gemini-3.1-flash-lite-preview",
}

export enum AudioModel {
  Whisper = "whisper-1",
  AudioPro = "Audio Pro",
  ElevenLabs = "scribe_v1",
}

export enum ImageModel {
  Dalle = "dall-e-3",
  FluxDev = "fal-ai/flux/dev",
  GptImage = "gpt-image-1",
  GeminiImage = "gemini-2.5-flash-image",
}

export enum WebsearchModel {
  Sonar = "sonar",
  SonarPro = "sonar-pro",
}

export enum EmbeddingModel {
  TextEmbedding3Small = "text-embedding-3-small",
  TextEmbedding3Large = "text-embedding-3-large",
  TextEmbeddingAda002 = "text-embedding-ada-002",
  TextEmbedding004 = "text-embedding-004",
}

export interface UsageItem {
  model: string;
  amount: number;
  unit: string;
  credits: number;
  private?: boolean;
}

export interface UsageRow {
  provider: string;
  details: UsageItem[];
}

export interface UsageOverview {
  tenant: string;
  month: string;
  creditsUsed: number;
}

export interface CreditUsage {
  tenantName: string;
  planName: string;
  creditsUsed: number;
  activeUsers: number;
}

// Type for token to credit mapping (input and output tokens)
export interface TokenCreditRate {
  input: number;
  output: number;
}
