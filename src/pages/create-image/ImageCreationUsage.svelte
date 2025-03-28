<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  const t = useTranslations();

  interface Props {
    todayAmount: number;
    thisMonthAmount: number;
    availableAmount: number;
    monthlyLimit: number;
  }

  let {
    todayAmount: today,
    thisMonthAmount: thisMonth,
    availableAmount: available,
    monthlyLimit = 0,
  }: Props = $props();
</script>

<div
  class="bottom-10 right-4 card shadow-lg p-8 w-xs ml-auto fixed"
  class:bg-base-100={available > 0}
  class:bg-yellow-400={available === 0}
  role="region"
  aria-label="Image usage statistics"
>
  <h3 class="text-xl font-semibold text-gray-700">
    {t("create-image.usage.current-usage")}
  </h3>

  {#if available === 0}
    <p class="text-base text-gray-600 mt-2">
      {t("create-image.usage.reach-limitation-message", {
        amount: monthlyLimit,
      })}
    </p>
  {:else}
    <p class="text-base text-gray-600 mt-2">
      {t("create-image.usage.today-usage", { amount: today }) ??
        `Today: ${today} images`}
    </p>
    <p class="text-base text-gray-600">
      {t("create-image.usage.this-month-usage", { amount: thisMonth }) ??
        `This month: ${thisMonth} images`}
    </p>
    <p class="text-base text-gray-600" class:text-red-600={available <= 0}>
      {t("create-image.usage.available-images", { amount: available }) ??
        `Available: ${available} images`}
    </p>
  {/if}
</div>
