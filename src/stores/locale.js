import { writable, get } from "svelte/store";
import { defaultLang } from "$i18n/ui";

export const locale = writable(defaultLang);

export function getLocale() {
  return get(locale);
}
