<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  const t = useTranslations();

  interface Props {
    todayAmount: number;
    thisMonthAmount: number;
    availableAmount: number;
  }

  let {
    todayAmount: today,
    thisMonthAmount: thisMonth,
    availableAmount: available,
  }: Props = $props();
</script>

<div
  class="bottom-10 right-4 card bg-base-100 shadow-lg p-4 w-64 ml-auto fixed"
>
  <h3 class="text-sm font-semibold text-gray-700">
    {t("create-image.usage.current-usage")}
  </h3>
  <p class="text-sm text-gray-600 mt-2">
    {t("create-image.usage.today-usage", { amount: today })}
  </p>
  <p class="text-sm text-gray-600">
    {t("create-image.usage.this-month-usage", {
      amount: thisMonth,
    })}
  </p>
  <p class="text-sm text-gray-600">
    {t("create-image.usage.available-images", {
      amount: available,
    })}
  </p>
</div>
