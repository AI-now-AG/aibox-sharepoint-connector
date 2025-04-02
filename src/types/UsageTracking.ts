export enum UsageType {
  Text = "text",
  Image = "image",
  Transcription = "transcription",
  Speech = "speech",
}

export interface UsageItem {
  model: string;
  amount: number;
  unit: string;
  credits: number;
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

// Type for token to credit mapping (input and output tokens)
export interface TokenCreditRate {
  input: number;
  output: number;
}

// Type for request to credit mapping
export type RequestCreditRate = number;
