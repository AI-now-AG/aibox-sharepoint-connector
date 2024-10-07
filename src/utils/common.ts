import { writable } from "svelte/store";

export const loading = writable(false);

export function showLoading() {
  loading.set(true);
}

export function hideLoading() {
  loading.set(false);
}
