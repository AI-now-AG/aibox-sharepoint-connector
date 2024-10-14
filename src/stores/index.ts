import { writable } from "svelte/store";

/* commom */
export const loading = writable(false);

export function showLoading() {
  loading.set(true);
}

export function hideLoading() {
  loading.set(false);
}

/* tenant */
export const tenant = writable(null);

/* user */
export const user = writable(null);
