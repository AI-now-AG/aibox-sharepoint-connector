import { writable } from "svelte/store";

// Store for the last generated DALL-E image (base64 string)
export const lastDalleImage = writable<string>("");
// Store for the last generated FLUX image (base64 string)
export const lastFluxImage = writable<string>("");
