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
  selectedAddOns: AudioOptionId[] = [],
): AudioCategory[] => {
  let transcriptionTypes = [];

  // Audio Basis + Add-ons
  if (selectedAddOns?.includes(AudioOptionId.AudioBasis)) {
    transcriptionTypes.push(AudioCategory.AudioToText);
  }
  // Deprecated: Subtitle (Allegro M) - commented for future restoration
  // if (selectedAddOns?.includes(AudioOptionId.AudioBasisAddOnSubtitle)) {
  //   transcriptionTypes.push(AudioCategory.Subtitle);
  // }
  if (selectedAddOns?.includes(AudioOptionId.AudioBasisAddOnLarge)) {
    transcriptionTypes.push(AudioCategory.AudioPro);
  }

  // Audio Premium
  if (selectedAddOns?.includes(AudioOptionId.AudioPremium)) {
    transcriptionTypes = [
      AudioCategory.AudioToText,
      // AudioCategory.Subtitle,      // Deprecated: Allegro (M) - commented for future restoration
      AudioCategory.AudioPro,
      // AudioCategory.SubtitleLarge, // Deprecated: Adagio (L) - commented for future restoration
      AudioCategory.Subtitle11Labs,
      // AudioCategory.SubtitleJson,  // Deprecated: commented for future restoration
    ];
  }

  return transcriptionTypes;
};

// Deprecated: Subtitle Editor is now always active when Subtitle Studio is active
// This function is kept for backwards compatibility but always returns true for AudioPremium
// which includes Subtitle Studio access
export const hasSubtitleEditor = (
  selectedAddOns: AudioOptionId[] = [],
): boolean => {
  // Subtitle Editor is always available when Subtitle Studio is active
  return selectedAddOns?.includes(AudioOptionId.AudioPremium);
};

export const getStripePrices = (keysToFind: ProductKeys[]): string[] => {
  const products = isProd() ? STRIPE_PRODUCTS_PROD : STRIPE_PRODUCTS_DEV;
  return keysToFind.map((key) => products[key]).filter(Boolean);
};

export const getStripeTaxRate = (): string => {
  return isProd() ? STRIPE_TAX_RATE_PROD : STRIPE_TAX_RATE_DEV;
};
