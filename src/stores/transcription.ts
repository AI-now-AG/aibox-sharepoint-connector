import { writable } from "svelte/store";

type ItemValue = {
  filename: string;
  output: string;
  completed: boolean;
};

const initialValue: ItemValue = {
  filename: "",
  output: "",
  completed: false,
};

const fetchUrl = "/.netlify/functions/checkFileExist";
const intervals = 10000;

let intervalId: any;

export const transcription = writable<ItemValue>(initialValue);

const fetchFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: filename }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.transcription) {
        transcription.update((item: ItemValue) => {
          item.completed = true;
          return item;
        });
      }
      if (result.exists) {
        clearInterval(intervalId);
        console.log("$stores/transcription => check file found.");
      } else {
        console.log("$stores/transcription => check file not found");
      }
    }
  } catch (error) {
    console.error("$stores/transcription => checking file error:", error);
  }
};

const doPoll = (item: ItemValue) => {
  intervalId = setInterval(() => {
    fetchFile(`${fetchUrl}`, item.filename);
  }, intervals);
};

transcription.subscribe((item: ItemValue) => {
  console.log("$stores/transcription => subscribe on value change", item);

  if (!item.completed) {
    //doPoll(item);
  }
});
