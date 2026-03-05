import { writable } from "svelte/store";

interface TenantFiltersStore {
  searchValue: string;
  statusFlags: string[];
  resellerCode: string;
}

const storageItemKey = "aibox:tenant-filters";
const initialData =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem(storageItemKey) || "{}")
    : {
        searchValue: "",
        statusFlags: [],
        resellerCode: "",
      };

export const tenantFilters = writable<TenantFiltersStore>(initialData);

tenantFilters.subscribe((value) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(storageItemKey, JSON.stringify(value));
  }
});
