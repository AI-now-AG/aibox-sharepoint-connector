import { writable } from "svelte/store";

interface TenantFiltersStore {
  searchValue: string;
  statusFlags: string[];
  resellerCode: string;
}

const storageItemKey = "aibox:tenant-filters";
const defaultValues: TenantFiltersStore = {
  searchValue: "",
  statusFlags: [],
  resellerCode: "",
};

const initialData: TenantFiltersStore =
  typeof window !== "undefined"
    ? {
        ...defaultValues,
        ...(JSON.parse(localStorage.getItem(storageItemKey) || "null") || {}),
      }
    : defaultValues;

export const tenantFilters = writable<TenantFiltersStore>(initialData);

tenantFilters.subscribe((value) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(storageItemKey, JSON.stringify(value));
  }
});
