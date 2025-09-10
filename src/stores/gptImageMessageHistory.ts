import { writable } from "svelte/store";
import type { Message } from "$types/MessageHistory";

// Store for GPT image message history
export const gptImageMessageHistory = writable<Message[]>([]);
// Store for GPT image files
export const gptImageFiles = writable<File[]>([]);
// Store for previous response id
export const gptImagePreviousResponseId = writable<string | null>(null);
