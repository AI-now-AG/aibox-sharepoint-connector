import { AudioCategory } from "$types/TenantFeature";
import { AudioOptionId, type ProductKeys } from "$types/Subscription";
import { isProd } from "$utils/env";
import { STRIPE_PRODUCTS, STRIPE_TAX_RATE } from "$constants";

export const getTranscriptionTypes = (
  selectedAddOns: AudioOptionId[] = [],
): AudioCategory[] => {
  let transcriptionTypes = [];

  // Audio Basis + Add-ons
  if (selectedAddOns?.includes(AudioOptionId.AudioBasis)) {
    transcriptionTypes.push(AudioCategory.AudioToText);
  }

  // : Subtitle (Allegro M) - commented for future restoration
  // if (selectedAddOns?.includes(AudioOptionId.AudioBasisAddOnSubtitle)) {
  //   transcriptionTypes.push(AudioCategory.Subtitle);
  // }

  if (selectedAddOns?.includes(AudioOptionId.AudioBasisAddOnLarge)) {
    transcriptionTypes.push(AudioCategory.AudioPro);
  }

  // NEW "Audio to Text" option (Audio Basis/Large are deprecated)
  // Includes Audio Basis + Audio Large
  if (selectedAddOns?.includes(AudioOptionId.AudioToText)) {
    transcriptionTypes = [AudioCategory.AudioToText, AudioCategory.AudioPro];
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

export const getStripePrices = (
  keysToFind: ProductKeys[],
  planName?: string,
): string[] => {
  const products = isProd() ? STRIPE_PRODUCTS.PROD : STRIPE_PRODUCTS.DEV;
  return keysToFind
    .map((key) => {
      if (planName && key === "AudioToText") {
        const compositeKey = `${key}_${planName}` as ProductKeys;
        return (
          products[compositeKey as keyof typeof products] ||
          products[key as keyof typeof products]
        );
      }
      return products[key as keyof typeof products];
    })
    .filter(Boolean);
};

export const getStripeTaxRate = (): string => {
  return isProd() ? STRIPE_TAX_RATE.PROD : STRIPE_TAX_RATE.DEV;
};
