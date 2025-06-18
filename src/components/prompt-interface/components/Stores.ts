import { writable } from "svelte/store";
import { type MessageHistory } from "$types/MessageHistory";

export const sharedMessageHistory = writable<MessageHistory>([]);
