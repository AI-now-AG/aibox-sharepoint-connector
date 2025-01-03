import { TranscriptionType } from "$types/TranscribeRequest";

interface BaseCard {
  title: string;
  description: string;
  toggle: boolean;
}

interface PlaintextCard extends BaseCard {
  type: TranscriptionType.Plaintext;
}

interface SummarizeCard extends BaseCard {
  type: TranscriptionType.Summarize;
}

interface SubtitlesCard extends BaseCard {
  type: TranscriptionType.Subtitles;
}

// Union Type for All Cards
export type TranscriptionCard = PlaintextCard | SummarizeCard | SubtitlesCard;
