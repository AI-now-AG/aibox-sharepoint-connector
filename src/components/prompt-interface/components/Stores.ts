import { writable } from "svelte/store";
import { type MessageHistory} from "$utils/MessageHistory";

export const storePromptId = writable(null);

export const sharedMessageHistory = writable<MessageHistory>([]);