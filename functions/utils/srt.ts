import type { Word } from "$utils/Speech/SpeechResponse";
import fs from "fs";

const MAX_LENGTH = 34; // from max-text-len.py News.srt max length was 38 character. We keep a bit of extra space for corrections
const MAX_DIFFERENCE = 4;
const NUMBER_OF_SECONDS = 2;

export type InputEntry = { word: string; start: number; end: number };
export type Entry = {
  text: string;
  start: number;
  end: number;
  secondLastWordEnd?: number;
  lastWordStart?: number;
};

// export const createSRTData = (words: InputEntry[]): Entry[] => {
//   const result: Entry[] = [];
//   let currentGroup: Entry | null = null;

//   for (const word of words) {
//     if (!currentGroup) {
//       const { word: inputWord, start, end } = word;
//       currentGroup = { text: inputWord, start, end };
//     } else if (currentGroup.text.length + word.word.length + 1 <= MAX_LENGTH) {
//       currentGroup.text += " " + word.word;
//       currentGroup.end = word.end;
//     } else {
//       result.push(currentGroup);
//       const { word: inputWord, start, end } = word;
//       currentGroup = { text: inputWord, start, end };
//     }
//   }

//   if (currentGroup) {
//     result.push(currentGroup);
//   }

//   return result;
// };

const shouldPushGroup = (
  nextContainer: InputEntry | null,
  container: InputEntry,
): boolean => {
  return (
    nextContainer !== null &&
    nextContainer.start - container.end >= NUMBER_OF_SECONDS
  );
};

export const createSRTData = (words: InputEntry[]): Entry[] => {
  const result: Entry[] = [];
  let currentGroup: Entry | null = null;

  for (const [index, container] of words.entries()) {
    const nextContainer = index + 1 < words.length ? words[index + 1] : null;
    if (!currentGroup) {
      const { word: inputWord, start, end } = container;
      currentGroup = { text: inputWord, start, end };
      if (shouldPushGroup(nextContainer, container)) {
        result.push(currentGroup);
        currentGroup = null;
      }
    } else if (
      currentGroup.text.length + container.word.length + 1 <= MAX_LENGTH &&
      (!nextContainer ||
        nextContainer.start - container.end <= NUMBER_OF_SECONDS)
    ) {
      currentGroup.text += " " + container.word;
      if (index > 0) currentGroup.secondLastWordEnd = words[index - 1].end;
      currentGroup.lastWordStart = words[index].start;
      currentGroup.end = container.end;
    } else if (shouldPushGroup(nextContainer, container)) {
      currentGroup.text += " " + container.word;
      result.push(currentGroup);
      currentGroup = null;
    } else {
      result.push(currentGroup);
      const { word: inputWord, start, end } = container;
      currentGroup = { text: inputWord, start, end };
    }
  }

  if (currentGroup) result.push(currentGroup);

  return result;
};

export const createSRTDataLarge = (words: Word[]): { words: InputEntry[] } => {
  const finalWords = words.map((word) => ({
    word: word.word,
    start: word.offsetInTicks / 10000000,
    end: (word.offsetInTicks + word.durationInTicks) / 10000000,
  }));
  return { words: finalWords };
};

// export const groupLines = (data: Entry[]) => {
//   const entries: Entry[] = [];
//   for (let i = 0; i < data.length; i += 2) {
//     const currentEntry = data[i];
//     const nextEntry = i + 1 < data.length ? data[i + 1] : null;

//     // Ensure text values are defined or default to empty strings
//     const currentText = currentEntry?.text || "";
//     const nextText = nextEntry?.text || "";

//     entries.push({
//       text: currentText + (nextEntry ? "\n" + nextText : ""),
//       start: currentEntry.start,
//       end: nextEntry ? nextEntry.end : currentEntry.end,
//     });
//   }

//   return entries;
// };

export const groupLines = (data: Entry[]): Entry[] => {
  const entries: Entry[] = [];
  let carryOverGroup: Entry | null = null;

  const adjustEntryEnd = (
    entry: Entry,
    nextEntry: Entry | null,
    maxDifference: number,
    shouldUpdateEnd: boolean = false,
    carryOverGroup: Entry | null,
  ): boolean => {
    if (!nextEntry) return false;

    const gap =
      (carryOverGroup ? carryOverGroup.start : nextEntry.start) - entry.end;
    if (gap >= NUMBER_OF_SECONDS) {
      entry.end += Math.min(gap, maxDifference);
      return true;
    }

    if (shouldUpdateEnd) {
      entry.end = nextEntry.start;
      return false;
    }
    return false;

    // if (!nextEntry) return false;
    // const difference = nextEntry.start - entry.end;

    // if (difference >= NUMBER_OF_SECONDS) {
    //   entry.end += Math.min(difference, maxDifference);
    //   return true;
    // } else {
    //   if (isNeedToUpdateEnd) {
    //     entry.end = nextEntry.start;
    //   }
    // }
    // return false;
  };

  const handleCarryOver = (entry: Entry): Entry | null => {
    const words = entry.text.split(/\s+/);
    if (words.length > 1 && /[.,!?;:]$/.test(words[words.length - 2])) {
      const carryOverWord = words.pop()!;
      const start = entry.lastWordStart || entry.end;
      entry.text = words.join(" ");
      entry.end = entry.secondLastWordEnd || entry.end;
      return { text: carryOverWord, start, end: entry.end };
    }
    return null;
  };

  let i = 0;
  while (i < data.length) {
    const currentEntry = data[i];
    let nextEntry = i + 1 < data.length ? data[i + 1] : null;
    const nextToNextEntry = i + 2 < data.length ? data[i + 2] : null;

    const currentText = carryOverGroup?.text
      ? `${carryOverGroup.text} ${currentEntry.text || ""}`
      : currentEntry.text || "";
    const currentStart = carryOverGroup?.start || currentEntry.start;

    carryOverGroup = nextEntry ? handleCarryOver(nextEntry) : null;
    if (nextEntry) {
      const shouldNullifyNext = adjustEntryEnd(
        currentEntry,
        nextEntry,
        MAX_DIFFERENCE,
        true,
        null,
      );

      if (shouldNullifyNext) {
        nextEntry = null;
      } else if (nextToNextEntry) {
        adjustEntryEnd(
          nextEntry,
          nextToNextEntry,
          MAX_DIFFERENCE,
          false,
          carryOverGroup,
        );
      }
    }

    entries.push({
      text: currentText + (nextEntry ? "\n" + nextEntry.text : ""),
      start: currentStart,
      end: nextEntry ? nextEntry.end : currentEntry.end,
    });
    i += nextEntry ? 2 : 1;
  }

  return entries;
};

const srtTimestamp = (ms: number, separator: string = ",") => {
  const date = new Date(ms * 1000);

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

  return `${hours}:${minutes}:${seconds}${separator}${milliseconds}`;
};

export const formatSRT = (entries: Entry[]) => {
  let out = "";
  for (const [index, entry] of entries.entries()) {
    out += `${index}
${srtTimestamp(entry.start)} --> ${srtTimestamp(entry.end)}
${entry.text}

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
${entry.text}

`);
  }
  stream.end();
};

export const formatASS = (entries: Entry[]): string => {
  let out = `[Script Info]
Title: Generated Subtitle
Original Script: Generated by transcription
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  for (const entry of entries) {
    out += `Dialogue: 0,${srtTimestamp(entry.start, ".")},${srtTimestamp(
      entry.end,
      ".",
      // )},Default,,0,0,0,,{\\c&HFFFFFF&}${entry.text.replace(/\n/g, "\\N")}\n`;
    )},Default,,0,0,0,,${entry.text.replace(/\n/g, "\\N")}\n`;
  }

  return out;
};
