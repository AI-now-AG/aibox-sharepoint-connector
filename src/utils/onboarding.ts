import { AudioCategory } from "$types/TenantFeature";
import { AudioOptionId, type ProductKeys } from "$types/Subscription";
import { isProd } from "$utils/env";
import {
  STRIPE_PRODUCTS_DEV,
  STRIPE_PRODUCTS_PROD,
  STRIPE_TAX_RATE_DEV,
  STRIPE_TAX_RATE_PROD,
} from "$constants";

export const getTranscriptionTypes = (
  selectedAddOns: AudioOptionId[],
): AudioCategory[] => {
  let transcriptionTypes = [];

  // Audio Basis + Add-ons
  if (selectedAddOns?.includes(AudioOptionId.AudioBasis)) {
    transcriptionTypes.push(AudioCategory.AudioToText);
  }
  if (selectedAddOns?.includes(AudioOptionId.AudioBasisAddOnSubtitle)) {
    transcriptionTypes.push(AudioCategory.Subtitle);
  }
  if (selectedAddOns?.includes(AudioOptionId.AudioBasisAddOnLarge)) {
    transcriptionTypes.push(AudioCategory.AudioPro);
  }

  // Audio Premium
  if (selectedAddOns?.includes(AudioOptionId.AudioPremium)) {
    transcriptionTypes = [
      AudioCategory.AudioToText,
      AudioCategory.Subtitle,
      AudioCategory.AudioPro,
      AudioCategory.SubtitleLarge,
      AudioCategory.Subtitle11Labs,
    ];
  }

  return transcriptionTypes;
};

export const getStripePrices = (keysToFind: ProductKeys[]): string[] => {
  const products = isProd() ? STRIPE_PRODUCTS_PROD : STRIPE_PRODUCTS_DEV;
  return keysToFind.map((key) => products[key]).filter(Boolean);
};

export const getStripeTaxRate = (): string => {
  return isProd() ? STRIPE_TAX_RATE_PROD : STRIPE_TAX_RATE_DEV;
};
