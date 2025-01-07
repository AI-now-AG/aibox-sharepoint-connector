import type { BatchStatus } from "$shared/transcriptionTasks";

export interface PollStatusResponse {
  self: string;
  model: {
    self: string;
  };
  links: {
    files: string;
  };
  properties: {
    diarizationEnabled: boolean;
    wordLevelTimestampsEnabled: boolean;
    channels: number[];
    punctuationMode: string;
    profanityFilterMode: string;
    destinationContainerUrl: string;
    languageIdentification: {
      candidateLocales: string[];
    };
    error?: ErrorResponse;
  };
  lastActionDateTime: string;
  status: BatchStatus; // "NotStarted" | "Running" | "Succeeded" | "Failed"
  createdDateTime: string;
  locale: string;
  displayName: string;
}

interface ErrorResponse {
  code: string;
  message: string;
}
