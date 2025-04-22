<script lang="ts">
  import SubsciptionSteps from "$components/subscription/SubsciptionSteps.svelte";
  import { useTranslations } from "$i18n/utils";
  import { onMount } from "svelte";
  import RadarLoading from "./RadarLoading.svelte";
  const t = useTranslations();

  function handleSubscription() {
    // TODO: Devlin - integrate API to create subscription
    // Simulate a delay of 2 seconds
    setTimeout(() => {
      // Redirect to the next step after the delay
      window.location.href = "/subscription/complete";
    }, 2000);
  }

  onMount(() => {handleSubscription()});
</script>

<div
  class="max-w-5xl mx-auto flex flex-col justify-center items-center min-h-full relative"
>
  <div
    class="bg-[#491EFF] p-4 rounded-lg mb-6 flex md:hidden lg:hidden items-center justify-center absolute top-0"
  >
    <SubsciptionSteps currentStep={4} />
  </div>

  <div
    class="w-[40px] h-[40px] absolute left-[50%] top-[42%] translate-[-50%] flex flex-col justify-center mb-6"
  >
    <RadarLoading />
  </div>
  <p class="font-sans text-3xl font-bold text-[#0F172A] text-center">
    {t("subscription.creating-your-account")}
  </p>
</div>
