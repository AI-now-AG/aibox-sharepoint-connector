import type { Tenant } from "$data/models/tenant.model";
import type { User } from "$data/models/user.model";
import { writable } from "svelte/store";

/* commom */
export const isOnboarding = writable<boolean>(false);

/* tenant */
export const tenant = writable<Tenant | null>(null);

/* user */
export const user = writable<User | null>(null);
