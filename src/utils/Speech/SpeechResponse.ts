export type DisplayWord = {
  displayText: string;
  offset: string;
  duration: string;
  offsetInTicks: number;
  durationInTicks: number;
  durationMilliseconds?: number;
  offsetMilliseconds?: number;
};

export type NBest = {
  confidence: number;
  lexical: string;
  itn: string;
  maskedITN: string;
  display: string;
  displayWords: DisplayWord[];
};

export type RecognizedPhrase = {
  recognitionStatus: string;
  channel: number;
  speaker?: number;
  offset: string;
  duration: string;
  offsetInTicks: number;
  durationInTicks: number;
  durationMilliseconds?: number;
  offsetMilliseconds?: number;
  nBest: Array<NBest>;
};

export type CombinedRecognizedPhrase = {
  channel: number;
  lexical: string;
  itn: string;
  maskedITN: string;
  display: string;
};

export type TranscriptionResponse = {
  source: string;
  timestamp: string;
  durationInTicks: number;
  duration: string;
  combinedRecognizedPhrases: CombinedRecognizedPhrase[];
  recognizedPhrases: RecognizedPhrase[];
};
