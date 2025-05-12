import { writable } from "svelte/store";
import { BillingMethod } from "$types/Subscription";

// Common interfaces for multilingual fields
interface MultilingualText {
  en: string;
  de: string;
}

interface Pricing {
  price: number;
  currency: string;
  priceText: string;
}

// Interface for subscription plan features
interface PlanFeatures {
  en: string[];
  de: string[];
}

// Interface for individual subscription plan
interface SubscriptionPlan {
  id: string;
  name: MultilingualText;
  description: MultilingualText;
  price: number;
  currency: string;
  priceText?: string;
  features: PlanFeatures;
}

// Interface for individual audio option
interface AudioOption {
  id: string;
  name: MultilingualText;
  price: number;
  currency: string;
  priceText?: string;
}

interface BillingInformation {
  companyName: string;
  street: string;
  zipCode: string;
  location: string;
  billingMethod: BillingMethod;
  billingEmail: string;
}

interface OrganizationInformation {
  companyName: string;
  defaultLanguage: string;
  useCases: string[];
}

interface SubscriptionStore {
  plan?: SubscriptionPlan;
  audioOptions?: AudioOption[];
  billingInformation?: BillingInformation;
  organizationInformation?: OrganizationInformation;
}

export type {
  SubscriptionStore,
  SubscriptionPlan,
  AudioOption,
  MultilingualText,
  Pricing,
  PlanFeatures,
  BillingInformation,
  OrganizationInformation,
};

const storageItemKey = "aiboxsubscription";
const initialData =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem(storageItemKey) || "{}")
    : {};

export const subscription = writable<SubscriptionStore>(initialData);

subscription.subscribe((value) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(storageItemKey, JSON.stringify(value));
  }
});

export const storePlan = (plan: SubscriptionPlan) => {
  subscription.update((origin: SubscriptionStore) => {
    return {
      ...origin,
      plan,
    };
  });
};

export const storeAudioOptions = (audioOptions?: AudioOption[]) => {
  subscription.update((origin: SubscriptionStore) => {
    return {
      ...origin,
      audioOptions: audioOptions ?? [],
    };
  });
};

export const storeBillingInformation = (
  billingInformation: BillingInformation,
) => {
  subscription.update((origin: SubscriptionStore) => {
    return {
      ...origin,
      billingInformation: billingInformation,
    };
  });
};

export const storeOrganizationInformation = (
  organizationInformation: OrganizationInformation,
) => {
  subscription.update((origin: SubscriptionStore) => {
    return {
      ...origin,
      organizationInformation: organizationInformation,
    };
  });
};

export default subscription;
