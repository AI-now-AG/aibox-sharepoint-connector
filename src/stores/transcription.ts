import { writable } from "svelte/store";

type TranscribeOptions = {
  file: File;
  output: string;
};

export const transcription = writable<TranscribeOptions | null>(null);

export const storeTranscribe = (object: TranscribeOptions) => {
  transcription.set(object);
};

transcription.subscribe((value) => {
  console.log("transcription subscribe", value);
});
