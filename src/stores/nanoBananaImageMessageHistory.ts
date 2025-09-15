import { writable } from "svelte/store";
import type { Message } from "$types/MessageHistory";

// Store for Nano Banana image message history
export const nanoBananaImageMessageHistory = writable<Message[]>([]);
// Store for Nano Banana image files
export const nanoBananaImageFiles = writable<File[]>([]);
