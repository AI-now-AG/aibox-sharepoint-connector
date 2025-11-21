export enum UsageType {
  Text = "text",
  Image = "image",
  Transcription = "transcription",
  Speech = "speech",
  Websearch = "websearch",
}

export enum TextModel {
  Gpt4o = "gpt-4o",
  Gpt5Old = "gpt-5",
  Gpt5 = "gpt-5.1",
  ClaudeSonnet = "claude-sonnet-4-0",
  Gemini = "gemini-2.5-flash",
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
  GeminiImage = "gemini-2.5-flash-image-preview",
}

export enum WebsearchModel {
  Sonar = "sonar",
  SonarPro = "sonar-pro",
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
