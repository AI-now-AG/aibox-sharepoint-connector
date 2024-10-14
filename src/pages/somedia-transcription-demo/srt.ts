import fs from "fs";

const MAX_LENGTH = 34; // from max-text-len.py News.srt max length was 38 character. We keep a bit of extra space for corrections

export type InputEntry = { word: string; start: number; end: number };
export type Entry = { text: string; start: number; end: number };

export const createSRTData = (words: InputEntry[]): Entry[] => {
  const result: Entry[] = [];
  let currentGroup: Entry | null = null;

  for (const word of words) {
    if (!currentGroup) {
      const { word: inputWord, start, end } = word;
      currentGroup = { text: inputWord, start, end };
    } else if (currentGroup.text.length + word.word.length + 1 <= MAX_LENGTH) {
      currentGroup.text += " " + word.word;
      currentGroup.end = word.end;
    } else {
      result.push(currentGroup);
      const { word: inputWord, start, end } = word;
      currentGroup = { text: inputWord, start, end };
    }
  }

  if (currentGroup) {
    result.push(currentGroup);
  }

  return result;
};

export const groupLines = (data: Entry[]) => {
  const entries: Entry[] = [];
  for (let i = 0; i < data.length; i += 2) {
    const currentEntry = data[i];
    const nextEntry = i + 1 < data.length ? data[i + 1] : null;

    entries.push({
      text: currentEntry.text + (nextEntry ? "\n" + nextEntry.text : ""),
      start: currentEntry.start,
      end: nextEntry ? nextEntry.end : currentEntry.end,
    });
  }

  return entries;
};

const srtTimestamp = (ms: number) => {
  const date = new Date(ms * 1000);

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

  return `${hours}:${minutes}:${seconds},${milliseconds}`;
};

export const formatSRT = (entries: Entry[]) => {
  let out = "";
  for (const [index, entry] of entries.entries()) {
    out += `${index}
${srtTimestamp(entry.start)} --> ${srtTimestamp(entry.end)}
<font color=#ffffff>${entry.text}</font>

`;
  }

  return out;
};

export const createSRTFile = async (filepath: string, entries: Entry[]) => {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }

  const stream = fs.createWriteStream(filepath, { flags: "a" });
  for (const [index, entry] of entries.entries()) {
    stream.write(`${index}
${srtTimestamp(entry.start)} --> ${srtTimestamp(entry.end)}
<font color=#ffffff>${entry.text}</font>

`);
  }
};
