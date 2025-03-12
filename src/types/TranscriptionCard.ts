import { TranscriptionType } from "$types/TranscribeRequest";
import type { AudioCategory } from "./TenantFeature";

interface BaseCard {
  title: string;
  category: AudioCategory[];
  toggle: boolean;
}

interface PlaintextCard extends BaseCard {
  type: TranscriptionType.Plaintext;
}

// interface SummarizeCard extends BaseCard {
//   type: TranscriptionType.Summarize;
// }

interface SubtitlesCard extends BaseCard {
  type: TranscriptionType.Subtitles;
}

// interface SubtitlesjsonCard extends BaseCard {
//   type: TranscriptionType.Subtitlesjson;
// }

interface LargefileCard extends BaseCard {
  type: TranscriptionType.Largefile;
}

// interface SubtitleLargeCard extends BaseCard {
//   type: TranscriptionType.SubtitleLarge;
// }

// Union Type for All Cards
export type TranscriptionCard =
  | PlaintextCard
  // | SummarizeCard
  | SubtitlesCard
  // | SubtitlesjsonCard
  | LargefileCard;
// | SubtitleLargeCard;
