<script lang="ts">
  import AudioOptionList from "$components/subscription/AudioOptionList.svelte";
  import SubscriptionPackageList from "$components/subscription/SubscriptionPackageList.svelte";
  import { useTranslations } from "$i18n/utils";
  import { SubscriptionPackages } from "$subscription-packages.json";
  const t = useTranslations();
</script>

<div class="max-w-5xl mx-auto">
  <!-- Pakage Plan -->
  <h1 class="font-sanns text-3xl font-bold text-black mt-2">
    {t("subscription.choose-your-plan")}
  </h1>
  <p class="font-sans text-base font-medium text-gray-600 mt-6 mb-10">
    {@html t("subscription.choose-your-plan-description")}
  </p>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-black">
    <SubscriptionPackageList />
  </div>

  <!-- Audio to Text Options -->
  <h1 class="font-sanns text-3xl font-bold text-black mt-2">
    {t("subscription.audio-to-text-options")}
  </h1>
  <p class="font-sans text-base font-medium text-gray-600 mt-6 mb-6">
    {@html t("subscription.choose-your-plan-description")}
  </p>
  <div class="mt-4">
    <AudioOptionList />
  </div>

  <!-- Total Price -->
  <div class="flex items-center justify-end">
    <p class="text-gray-600 text-right mr-4 font-bold font-inter text-sm">
      {t("subscription.total-price-for-plan", { total: 123 })}
    </p>
    <button class="btn btn-active btn-primary min-w-[144px]">
      {t("common.next")}
    </button>
  </div>
</div>
