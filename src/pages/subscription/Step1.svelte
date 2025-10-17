<script lang="ts">
  import AudioOptionList from "$components/subscription/AudioOptionList.svelte";
  import SubsciptionSteps from "$components/subscription/SubsciptionSteps.svelte";
  import SubscriptionPackageList from "$components/subscription/SubscriptionPackageList.svelte";
  import { useTranslations } from "$i18n/utils";
  import { SubscriptionPackages } from "$data/subscription-packages";
  import AlertDialog from "$components/AlertDialog.svelte";
  import {
    storeAudioOptions,
    storePlan,
    type AudioOption,
    type SubscriptionPlan,
    subscription,
  } from "$stores/subscription";

  interface Props {
    defaultLanguage?: string;
  }
  let { defaultLanguage = "en" }: Props = $props();
  const t = useTranslations(defaultLanguage);

  let totalPrice: any = $state("");

  const initSelectedPackageId = $subscription.plan?.id || "";
  let initSelectedAudioOptionIds: string[] =
    $subscription.audioOptions?.map((option) => {
      return option.id;
    }) || [];
  let selectedPackageId = $state(initSelectedPackageId);
  let selectedAudioOptionIds: string[] = $state(initSelectedAudioOptionIds);

  let alertModal: HTMLDialogElement | undefined = $state();
  let alertMessage = $state("");

  // Calculate total price (include package and audio options)
  $effect(() => {
    let packagePrice = 0;
    let audioOptionsTotalPrice = 0;

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
          audioOptionsTotalPrice += audioOption?.price || 0;
        }
      });
    }

    totalPrice = packagePrice + audioOptionsTotalPrice;
  });

  function showAlert(message: any) {
    alertMessage = message;
    alertModal?.showModal();
  }

  function handleNext() {
    if (!selectedPackageId) {
      showAlert(t("subscription.please-select-package"));
      return;
    }

    const selectedPackage: SubscriptionPlan = {
      ...SubscriptionPackages.plan[
        selectedPackageId as keyof typeof SubscriptionPackages.plan
      ],
      id: selectedPackageId,
    };
    if (selectedPackage) {
      storePlan(selectedPackage);
    }

    let selectedAudioOptions: AudioOption[] = [];
    if (selectedAudioOptionIds?.length > 0) {
      for (let i = 0; i < selectedAudioOptionIds.length; i++) {
        const id = selectedAudioOptionIds[i];
        const selectedOption: AudioOption = {
          ...SubscriptionPackages.audioOptions[
            id as keyof typeof SubscriptionPackages.audioOptions
          ],
          id: id,
        };
        if (selectedOption) {
          selectedAudioOptions.push(selectedOption);
        }
      }
    }
    storeAudioOptions(selectedAudioOptions);

    window.location.href = "/subscription/step2";
  }
</script>

<div class="max-w-5xl mx-auto">
  <div
    class="bg-[#491EFF] p-4 rounded-lg mb-6 flex md:hidden lg:hidden items-center justify-center"
  >
    <SubsciptionSteps currentStep={1} {defaultLanguage} />
  </div>
  <!-- Pakage Plan -->
  <h1 class="font-sanns text-3xl font-bold text-black mt-2">
    {t("subscription.choose-your-plan")}
  </h1>
  <p class="font-sans text-base font-medium text-gray-600 mt-6 mb-10">
    {@html t("subscription.choose-your-plan-description")}
  </p>
  <div
    class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-10 text-black"
  >
    <SubscriptionPackageList bind:selectedPackageId {defaultLanguage} />
  </div>

  <!-- Audio to Text Options -->
  <h1 class="font-sanns text-3xl font-bold text-black mt-2">
    {t("subscription.audio-to-text-options")}
  </h1>
  <p class="font-sans text-base font-medium text-gray-600 mt-6 mb-6">
    {@html t("subscription.choose-your-plan-description")}
  </p>
  <div class="mt-4">
    <AudioOptionList bind:selectedAudioOptionIds {defaultLanguage} />
  </div>

  <div class="w-full flex items-center justify-end rounded-lg p-4">
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

<AlertDialog
  bind:modal={alertModal}
  bind:message={alertMessage}
  okText={t("common.ok")}
/>
