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
          return (
            option == AudioOptionId.AudioBasis ||
            option == AudioOptionId.AudioBasisAddOnLarge
          );
        }) || []
      : planAddOns.filter((option: any) => {
          return (
            option == AudioOptionId.AudioBasisAddOnSubtitle ||
            option == AudioOptionId.AudioPremium
          );
        }) || [];
  const firstOption = addOnOptions?.[0] as AudioOptionId | undefined;
  return firstOption ? AudioOptionLabels[firstOption] || "-" : "-";
};
