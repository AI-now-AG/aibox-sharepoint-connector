import { writable } from "svelte/store";

type TranscribeOptions = {
  file: File;
  duration: string;
  output: string;
};

export const transcription = writable<TranscribeOptions | null>(null);

export const storeTranscribe = (object: TranscribeOptions) => {
  transcription.set(object);
};
