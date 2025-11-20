import { useTranslations } from "$i18n/utils";
import { Countries } from "$types/Subscription";

export const useTranslatedCountryList = () => {
  const t = useTranslations();

  return Countries.map((country) => ({
    ...country,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    title: t(`subscription.country.${country.value?.toLowerCase()}` as any),
  }));
};  