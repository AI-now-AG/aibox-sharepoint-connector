<script lang="ts">
  import SubsciptionSteps from "$components/subscription/SubsciptionSteps.svelte";
  import { useTranslations } from "$i18n/utils";

  interface Props {
    defaultLanguage?: string;
  }
  let { defaultLanguage = "en" }: Props = $props();
  const t = useTranslations(defaultLanguage);

  function goToHome() {
    window.location.href = "/";
  }
</script>

<div
  class="max-w-5xl mx-auto flex flex-col justify-center items-center min-h-full relative"
>
  <div
    class="bg-[#491EFF] p-4 rounded-lg mb-6 flex md:hidden lg:hidden items-center justify-center absolute top-0"
  >
    <SubsciptionSteps currentStep={5} {defaultLanguage} />
  </div>

  <div
    class="bg-[#00CFBD] w-[80px] h-[80px] rounded-full flex justify-center items-center mb-6"
  >
    <span class="text-white text-4xl"> ✓ </span>
  </div>
  <p class="font-sans text-3xl font-bold text-[#0F172A] text-center mb-6">
    {t("subscription.congratulations")}
  </p>

  <p class="font-sans text-base font-medium text-[#0F172A] text-center mb-6">
    {t("subscription.congratulations-desciption")}
  </p>

  <button
    class="btn btn-active btn-primary min-w-[300px] md:min-w-[570px] mt-6"
    onclick={() => {
      goToHome();
    }}
  >
    {t("subscription.cool-lets-start")}
  </button>
</div>
