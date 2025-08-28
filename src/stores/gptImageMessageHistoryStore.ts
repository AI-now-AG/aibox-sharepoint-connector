import { writable } from "svelte/store";
import type { Message } from "$types/MessageHistory";

// Store for GPT image message history
export const gptImageMessageHistory = writable<Message[]>([]);
// Store for GPT image files
export const gptImageFiles = writable<File[]>([]);
// Store for previous response id
export const gptImagePreviousResponseId = writable<string | null>(null);

export function saveGptImageMessageHistory(history: Message[]) {
  gptImageMessageHistory.set(history);
}

export function saveGptImageFiles(files: File[]) {
  gptImageFiles.set(files);
}

export function saveGptImagePreviousResponseId(id: string | null) {
  gptImagePreviousResponseId.set(id);
}

export function restoreGptImageMessageHistory(
  setter: (history: Message[]) => void,
) {
  const unsub = gptImageMessageHistory.subscribe((history) => {
    setter(history);
    unsub();
  });
}
