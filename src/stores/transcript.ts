import { writable } from "svelte/store";

type TranscribeOptions = {
  file: File | undefined;
  duration: string;
  txtOuput: string;
  txtUrl: string;
  srtUrl: string;
  assUrl: string;
  jsonUrl: string;
};

const transcript = writable<TranscribeOptions | null>(null);

transcript.subscribe((value) => {
  console.log("$stores/transcript subscribe values on change", value);
});

export default transcript;
