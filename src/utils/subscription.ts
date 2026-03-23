/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslations } from "$i18n/utils";
import {
  Countries,
  AudioOptionId,
  AudioOptionLabels,
} from "$types/Subscription";

export const useTranslatedCountryList = (defaultLanguage?: string) => {
  const t = useTranslations(defaultLanguage);

  return Countries.map((country) => ({
    ...country,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    title: t(`subscription.country.${country.value?.toLowerCase()}` as any),
  }));
};

export const getSubscriptionAddOnName = (
  forOption: "audiototext" | "subtitle" = "audiototext",
  planAddOns: Array<any> = [],
) => {
  const addOnOptions: Array<any> =
    forOption == "audiototext"
      ? planAddOns.filter((option: any) => {
          return [
            AudioOptionId.AudioBasis,
            AudioOptionId.AudioBasisAddOnLarge,
            AudioOptionId.AudioToText,
          ].includes(option);
        }) || []
      : planAddOns.filter((option: any) => {
          return [
            AudioOptionId.AudioBasisAddOnSubtitle,
            AudioOptionId.AudioPremium,
          ].includes(option);
        }) || [];
  const firstOption = addOnOptions?.[0] as AudioOptionId | undefined;
  return firstOption ? AudioOptionLabels[firstOption] : "";
};
