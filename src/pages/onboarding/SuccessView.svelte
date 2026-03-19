<script lang="ts">
  import { useTranslations } from "$i18n/utils";

  interface OnboardingResult {
    assistants: number;
    pagesAnalysed: number;
    knowledgeBases: number;
  }

  interface Props {
    result: OnboardingResult;
    organizationName: string;
    selectedTagName: string;
  }

  let { result, organizationName, selectedTagName }: Props = $props();

  const t = useTranslations();
</script>

<!-- Header -->
<div class="flex items-center gap-3 mb-2">
  <img src="/favicon.svg" alt="aibox" class="w-9 h-9 rounded-lg" />
  <h1 class="text-2xl font-bold text-gray-900">
    {t("self-onboarding.success-title")}
  </h1>
</div>

<p class="text-sm text-gray-500 mb-7">
  {t("self-onboarding.success-subtitle")}
</p>

<!-- Stats row -->
<div class="flex gap-3 mb-5">
  {#if result.assistants}
    <div class="flex-1 bg-gray-100 rounded-xl p-4 text-center">
      <p class="text-2xl font-bold" style="color: #491EFF;">
        {result.assistants}
      </p>
      <p class="text-xs text-gray-500 mt-1">
        {t("self-onboarding.stat-assistants")}
      </p>
    </div>
  {/if}
  {#if result.pagesAnalysed}
    <div class="flex-1 bg-gray-100 rounded-xl p-4 text-center">
      <p class="text-2xl font-bold" style="color: #491EFF;">
        {result.pagesAnalysed}
      </p>
      <p class="text-xs text-gray-500 mt-1">
        {t("self-onboarding.stat-pages")}
      </p>
    </div>
  {/if}
  {#if result.knowledgeBases}
    <div class="flex-1 bg-gray-100 rounded-xl p-4 text-center">
      <p class="text-2xl font-bold" style="color: #491EFF;">
        {result.knowledgeBases}
      </p>
      <p class="text-xs text-gray-500 mt-1">{t("self-onboarding.stat-kb")}</p>
    </div>
  {/if}
</div>

<!-- Organization + Industry summary -->
<div class="bg-gray-100 rounded-xl overflow-hidden mb-5">
  <div class="flex items-center justify-between px-4 py-3">
    <span class="text-sm text-gray-500"
      >{t("self-onboarding.summary-organization")}</span
    >
    <span class="text-sm font-bold text-gray-900">{organizationName}</span>
  </div>
  <div
    class="border-t border-gray-200 flex items-center justify-between px-4 py-3"
  >
    <span class="text-sm text-gray-500"
      >{t("self-onboarding.summary-industry")}</span
    >
    <span class="text-sm font-bold text-gray-900">{selectedTagName}</span>
  </div>
</div>

<!-- Trial banner -->
<div
  class="flex items-start gap-3 rounded-xl border px-4 py-4 mb-7"
  style="background-color: #FFFBEB; border-color: #FDE68A;"
>
  <span class="text-xl leading-none mt-0.5">⭐</span>
  <div>
    <p class="text-sm font-bold text-gray-900">
      {t("self-onboarding.trial-title")}
    </p>
    <p class="text-xs text-gray-500 mt-0.5">
      {t("self-onboarding.trial-description")}
    </p>
  </div>
</div>

<!-- CTA -->
<a
  type="button"
  class="btn w-full rounded-full py-3 font-bold text-white text-base"
  style="background-color: #3730C7; border-color: #3730C7;"
  href="/"
>
  {t("self-onboarding.start-btn")} →
</a>
