<script lang="ts">
  import AudioOptionList from "$components/subscription/AudioOptionList.svelte";
  import SubscriptionPackageList from "$components/subscription/SubscriptionPackageList.svelte";
  import { useTranslations } from "$i18n/utils";
  import { SubscriptionPackages } from "$subscription-packages.json";
  const t = useTranslations();

  let totalPrice: any = $state("");
  let selectedPackageId = $state("");
  let selectedAudioOptionIds: string[] = $state([]);

  // Calculate total price (include package and audio options)
  $effect(() => {
    let packagePrice = 0;
    let audioOptionsTotlaPrice = 0;

    // Get package price
    if (selectedPackageId) {
      let selectedPackage =
        SubscriptionPackages.plan[
          selectedPackageId as keyof typeof SubscriptionPackages.plan
        ];
      if (selectedPackage) {
        packagePrice = selectedPackage?.price || 0;
      }
    }

    // Get audio options price
    if (selectedAudioOptionIds.length > 0) {
      selectedAudioOptionIds.forEach((audioOptionId) => {
        let audioOption =
          SubscriptionPackages.audioOptions[
            audioOptionId as keyof typeof SubscriptionPackages.audioOptions
          ];
        if (audioOption) {
          audioOptionsTotlaPrice += audioOption?.price || 0;
        }
      });
    }

    totalPrice = packagePrice + audioOptionsTotlaPrice;
  });

  // Store subscription data into storage
  $effect(() => {
    if (selectedPackageId) {
      // TODO: Store selected package data into storage
    }
    if (selectedAudioOptionIds?.length > 0) {
      // TODO: Store selected audio options data into storage
    }
  });

  function handleNext() {
    if (!selectedPackageId) {
      alert(t("subscription.please-select-package"));
      return;
    }
    window.location.href = "/subscription/step2";
  }
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
    <SubscriptionPackageList bind:selectedPackageId />
  </div>

  <!-- Audio to Text Options -->
  <h1 class="font-sanns text-3xl font-bold text-black mt-2">
    {t("subscription.audio-to-text-options")}
  </h1>
  <p class="font-sans text-base font-medium text-gray-600 mt-6 mb-6">
    {@html t("subscription.choose-your-plan-description")}
  </p>
  <div class="mt-4">
    <AudioOptionList bind:selectedAudioOptionIds />
  </div>

  <div class="fixed bottom-4 right-10 w-[33.3%] flex items-center justify-end">
    <p class="text-gray-600 text-right mr-4 font-bold font-inter text-sm">
      {t("subscription.total-price-for-plan", { total: totalPrice })}
    </p>
    <button
      class="btn btn-active btn-primary min-w-[144px]"
      onclick={() => {
        handleNext();
      }}
    >
      {t("common.next")}
    </button>
  </div>
</div>
