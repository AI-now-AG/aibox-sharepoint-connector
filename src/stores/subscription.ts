import { writable } from "svelte/store";
enum SubscriptionPackageId {
  Starter = "Starter",
  Teams = "Teams",
  Pro = "Pro",
}

enum AudioOptionId {
  AudioPremium = "AudioPremium",
  AudioBasis = "AudioBasis",
  AudioBasisAddOnSubtitle = "AudioBasisAddOnSubtitle",
  AudioBasisAddOnLarge = "AudioBasisAddOnLarge",
}

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
  id: SubscriptionPackageId;
  name: MultilingualText;
  description: MultilingualText;
  price: number;
  currency: string;
  priceText?: string;
  features: PlanFeatures;
}

// Interface for individual audio option
interface AudioOption {
  id: AudioOptionId;
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
  billingMethod: "monthlyInvoice" | "creditCard";
  billingEmail: string;
}

interface OrganizationInformation {
  companyName: string;
  defaultLanguage: string;
  useCases: string[];
}

interface AiboxSubscription {
  plan?: SubscriptionPlan;
  audioOptions?: AudioOption;
  billingInformation?: BillingInformation;
  organizationInformation?: OrganizationInformation;
}

export type {
  AiboxSubscription,
  SubscriptionPlan,
  AudioOption,
  SubscriptionPackageId,
  AudioOptionId,
  MultilingualText,
  Pricing,
  PlanFeatures,
  BillingInformation,
  OrganizationInformation,
};

export const aiboxsubscription = writable<AiboxSubscription>({});

export const storePlan = (plan: SubscriptionPlan) => {
  aiboxsubscription.update((origin: AiboxSubscription) => {
    return {
      ...origin,
      plan,
    };
  });
};

export const storeAudioOptions = (audioOptions?: AudioOption) => {
  aiboxsubscription.update((origin: AiboxSubscription) => {
    return {
      ...origin,
      audioOptions: audioOptions ?? undefined,
    };
  });
};

export const storeBillingInformation = (
  billingInformation: BillingInformation,
) => {
  aiboxsubscription.update((origin: AiboxSubscription) => {
    return {
      ...origin,
      billingInformation: billingInformation,
    };
  });
};

export const storeOrganizationInformation = (
  organizationInformation: OrganizationInformation,
) => {
  aiboxsubscription.update((origin: AiboxSubscription) => {
    return {
      ...origin,
      organizationInformation: organizationInformation,
    };
  });
};

export const reset = () => {
  aiboxsubscription.update(() => {
    return {};
  });
};
