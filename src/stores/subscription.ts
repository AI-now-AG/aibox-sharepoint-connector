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
  contactPhone: string;
  contactName: string;
  billingMethod: BillingMethod;
  billingEmail: string;
}

interface OrganizationInformation {
  organizationName: string;
  defaultLanguage: string;
  selectedTags: string[];
  selectedCategories: string[];
}

interface StripeCheckout {
  customerId?: string;
}

interface SubscriptionStore {
  plan?: SubscriptionPlan;
  audioOptions?: AudioOption[];
  billingInfo?: BillingInformation;
  organizationInfo?: OrganizationInformation;
  stripeCheckout?: StripeCheckout;
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

const storageItemKey = "aiboxSubscription";
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

export const storeBillingInfo = (billingInfo: BillingInformation) => {
  subscription.update((origin: SubscriptionStore) => {
    return {
      ...origin,
      billingInfo: billingInfo,
    };
  });
};

export const storeOrganizationInfo = (
  organizationInfo: OrganizationInformation,
) => {
  subscription.update((origin: SubscriptionStore) => {
    return {
      ...origin,
      organizationInfo: organizationInfo,
    };
  });
};

export const storeStripeCheckout = (stripeCheckout: StripeCheckout) => {
  subscription.update((origin: SubscriptionStore) => {
    return {
      ...origin,
      stripeCheckout: stripeCheckout,
    };
  });
};

export default subscription;
