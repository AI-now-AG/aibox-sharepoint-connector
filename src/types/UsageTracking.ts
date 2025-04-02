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
