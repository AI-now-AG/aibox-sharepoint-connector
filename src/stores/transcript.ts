import { writable } from "svelte/store";
import { TranscriptionType } from "$types/TranscribeRequest";

type TranscribeOptions = {
  file: File | undefined;
  duration: string;
  txtOuput: string;
  txtUrl: string;
  srtUrl: string;
  assUrl: string;
  jsonUrl: string;
  zipFile: string;
};

type TranscriptEntry = {
  type: TranscriptionType;
  options: TranscribeOptions;
};

const transcriptStore = writable<TranscriptEntry[]>([]);

transcriptStore.subscribe((value) => {
  console.log("$stores/transcript subscribe values on change", value);
});

export default transcriptStore;
