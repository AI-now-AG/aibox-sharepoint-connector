import { writable } from "svelte/store";

type TranscribeOptions = {
  file: File;
  duration: string;
  outputFileUrl: string;
};

export const transcription = writable<TranscribeOptions | null>(null);

export const storeTranscribe = (object: TranscribeOptions) => {
  transcription.set(object);
};

export const resetTranscribe = () => {
  transcription.set(null);
};
