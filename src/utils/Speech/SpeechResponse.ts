export type DisplayWord = {
  displayText: string;
  offset: string;
  duration: string;
  offsetInTicks: number;
  durationInTicks: number;
};

export type RecognizedPhrase = {
  recognitionStatus: string;
  channel: number;
  offset: string;
  duration: string;
  offsetInTicks: number;
  durationInTicks: number;
  nBest: Array<{
    confidence: number;
    lexical: string;
    itn: string;
    maskedITN: string;
    display: string;
    displayWords: DisplayWord[];
  }>;
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
