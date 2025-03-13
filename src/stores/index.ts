import type { Tenant } from "$data/models/tenant.model";
import type { User } from "$data/models/user.model";
import { writable } from "svelte/store";

/* commom */
export const loading = writable<boolean>(false);

export function showLoading() {
  loading.set(true);
}

export function hideLoading() {
  loading.set(false);
}

/* tenant */
export const tenant = writable<Tenant | null>(null);

/* user */
export const user = writable<User | null>(null);

export const isOnboarding = writable<boolean>(false);
export function setOnboarding(value: boolean) {
  isOnboarding.set(value);
}
