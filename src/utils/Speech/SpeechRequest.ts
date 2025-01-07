export interface DiarizationProperties {
  speakers: {
    minCount: number;
    maxCount: number;
  };
}

// Define the structure for language identification properties
export interface LanguageIdentification {
  candidateLocales: string[];
}

// Define the structure of the properties object
export interface TranscriptionProperties {
  wordLevelTimestampsEnabled: boolean;
  displayFormWordLevelTimestampsEnabled: boolean;
  diarizationEnabled: boolean;
  diarization?: DiarizationProperties; // Diarization is optional and will be added conditionally
  languageIdentification: LanguageIdentification;
  punctuationMode: string;
  profanityFilterMode: string;
  destinationContainerUrl: string;
}

// Define the structure for the entire body object
export interface TranscriptionRequestBody {
  displayName: string;
  locale: string;
  contentUrls: string[];
  properties: TranscriptionProperties;
  customProperties: Record<string, unknown>;
}
