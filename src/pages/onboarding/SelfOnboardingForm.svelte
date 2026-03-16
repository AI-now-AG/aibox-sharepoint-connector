<script lang="ts">
  import type { TagItem } from "$types/Subscription";
  import { useTranslations } from "$i18n/utils";
  import { bgOpacity } from "$utils/common";

  interface Props {
    tags: TagItem[];
    defaultLanguage?: string;
  }

  let { tags = [], defaultLanguage = "en" }: Props = $props();

  const t = useTranslations(defaultLanguage);

  const defaultTagIconColor = "#491EFF";
  const defaultTagEmoji = "🏢";

  // ── Const enums (enums are unsupported in Svelte script blocks) ──────────
  const View = {
    Form: "form",
    Processing: "processing",
    Success: "success",
  } as const;
  type View = (typeof View)[keyof typeof View];

  const StepStatus = {
    Completed: "completed",
    Active: "active",
    Pending: "pending",
  } as const;
  type StepStatus = (typeof StepStatus)[keyof typeof StepStatus];

  // ── View state ────────────────────────────────────────────────────────────
  let currentView: View = $state(View.Form);

  // ── Form state ────────────────────────────────────────────────────────────
  let organizationName = $state("");
  let websiteUrl = $state("");
  let selectedTag = $state("");
  let showIndustryPicker = $state(false);

  const selectedTagTitle = $derived(
    tags.find((tag) => tag.value === selectedTag)?.title ?? "",
  );

  function toggleIndustryPicker() {
    showIndustryPicker = !showIndustryPicker;
  }

  function selectTag(tagId: string) {
    selectedTag = selectedTag === tagId ? "" : tagId;
  }

  function handleCreate() {
    currentView = View.Processing;
  }

  // ── Result state (populated by backend once wired up) ─────────────────────
  interface OnboardingResult {
    assistants: number;
    pagesAnalysed: number;
    knowledgeBases: number;
  }

  let result: OnboardingResult = $state({
    assistants: 0,
    pagesAnalysed: 0,
    knowledgeBases: 0,
  });

  // ── Processing steps ──────────────────────────────────────────────────────
  interface Step {
    key: string;
    label: string;
    status: StepStatus;
  }

  const steps: Step[] = $derived([
    {
      key: "analyse-website",
      label: t("self-onboarding.step-analyse-website"),
      status: StepStatus.Completed,
    },
    {
      key: "create-aibox",
      label: t("self-onboarding.step-create-aibox"),
      status: StepStatus.Active,
    },
    {
      key: "create-kb",
      label: t("self-onboarding.step-create-kb"),
      status: StepStatus.Pending,
    },
    {
      key: "configure-assistants",
      label: t("self-onboarding.step-configure-assistants"),
      status: StepStatus.Pending,
    },
    {
      key: "finalize-setup",
      label: t("self-onboarding.step-finalize-setup"),
      status: StepStatus.Pending,
    },
  ]);

  const activeStepIndex = $derived(
    steps.findIndex((s) => s.status === StepStatus.Active),
  );
  const progressPercent = $derived(
    activeStepIndex <= 0 ? 0 : (activeStepIndex / (steps.length - 1)) * 100,
  );
</script>

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- White card (shared container for all views)                            -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
  <!-- ── FORM VIEW ──────────────────────────────────────────────────────── -->
  {#if currentView === View.Form}
    <!-- Icon + Title -->
    <div class="flex items-center gap-3 mb-2">
      <img src="/favicon.svg" alt="aibox" class="w-9 h-9 rounded-lg" />
      <h1 class="text-2xl font-bold text-gray-900">
        {t("self-onboarding.card-title")}
      </h1>
    </div>

    <p class="text-sm text-gray-500 mb-7">
      {t("self-onboarding.card-subtitle")}
    </p>

    <!-- Organisation name -->
    <div class="mb-5">
      <label
        for="org-name"
        class="block text-sm font-semibold text-gray-900 mb-2"
      >
        {t("self-onboarding.org-name-label")}
      </label>
      <input
        id="org-name"
        type="text"
        class="input input-bordered w-full"
        placeholder={t("self-onboarding.org-name-placeholder")}
        bind:value={organizationName}
      />
    </div>

    <!-- Website URL -->
    <div class="mb-1">
      <label
        for="website-url"
        class="block text-sm font-semibold text-gray-900 mb-2"
      >
        {t("self-onboarding.website-label")}
        <span class="font-normal text-gray-400 ml-1">
          ({t("self-onboarding.optional")})
        </span>
      </label>
      <input
        id="website-url"
        type="url"
        class="input input-bordered w-full"
        placeholder={t("self-onboarding.website-placeholder")}
        bind:value={websiteUrl}
      />
    </div>

    <p class="text-xs text-gray-400 mt-2 mb-5">
      {t("self-onboarding.website-hint")}
    </p>

    <!-- Manual industry picker toggle -->
    <button
      type="button"
      class="flex items-center gap-1.5 text-[#491EFF] font-medium text-sm mb-5 hover:underline"
      onclick={toggleIndustryPicker}
    >
      <svg
        class={`w-4 h-4 transition-transform duration-200 ${showIndustryPicker ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"
        ></path>
      </svg>
      {t("self-onboarding.manual-industry")}
    </button>

    <!-- Collapsible industry card grid -->
    {#if showIndustryPicker}
      {#if tags.length === 0}
        <p class="text-sm text-gray-400 mb-5">{t("self-onboarding.no-tags")}</p>
      {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {#each tags as tag}
            <button
              type="button"
              class={`w-full p-3 rounded-xl border-2 transition-all duration-150 text-left flex flex-col gap-1.5
                ${
                  selectedTag === tag.value
                    ? "border-[#2453FF] bg-white shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              onclick={() => selectTag(tag.value)}
            >
              <div class="flex items-center gap-2.5">
                <div
                  class="flex w-8 h-8 items-center justify-center rounded-lg shrink-0"
                  style={`color:${tag.iconColor || defaultTagIconColor}; background:${bgOpacity(tag.iconColor || defaultTagIconColor)}`}
                >
                  {#if tag.icon}
                    {#if tag.icon.trim().startsWith("data:image")}
                      <img
                        src={tag.icon}
                        alt=""
                        class="w-5 h-5 object-contain"
                      />
                    {:else}
                      <span class="text-lg leading-none">{tag.icon}</span>
                    {/if}
                  {:else}
                    <span class="text-lg leading-none">{defaultTagEmoji}</span>
                  {/if}
                </div>

                <span
                  class="flex-1 font-semibold text-sm text-gray-900 leading-tight"
                >
                  {tag.title}
                </span>

                {#if selectedTag === tag.value}
                  <div
                    class="w-4 h-4 rounded-full bg-[#2453FF] text-white flex items-center justify-center shrink-0"
                    style="font-size: 9px;"
                  >
                    ✓
                  </div>
                {/if}
              </div>

              {#if tag.description}
                <p class="text-xs text-gray-400 leading-snug pl-[42px]">
                  {tag.description}
                </p>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    {/if}

    <!-- CTA -->
    <button
      type="button"
      class="btn w-full rounded-full py-3 font-bold text-white text-base"
      style="background-color: #3730C7; border-color: #3730C7;"
      onclick={handleCreate}
    >
      {t("self-onboarding.create-btn")}
    </button>

    <!-- ── PROCESSING VIEW ────────────────────────────────────────────────── -->
  {:else if currentView === View.Processing}
    <!-- Icon + Title -->
    <div class="flex items-center gap-3 mb-2">
      <img src="/favicon.svg" alt="aibox" class="w-9 h-9 rounded-lg" />
      <h1 class="text-2xl font-bold text-gray-900">
        {t("self-onboarding.processing-title")}
      </h1>
    </div>

    <p class="text-sm text-gray-500 mb-8">
      {t("self-onboarding.processing-subtitle")}
    </p>

    <!-- Progress bar -->
    <div class="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-700 ease-in-out"
        style={`width: ${progressPercent}%; background-color: #491EFF;`}
      ></div>
    </div>

    <!-- Step list -->
    <ul class="space-y-5">
      {#each steps as step}
        <li class="flex items-center gap-4">
          <!-- Status icon -->
          {#if step.status === StepStatus.Completed}
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white"
              style="background-color: #22C55E; font-size: 11px;"
            >
              ✓
            </div>
          {:else if step.status === StepStatus.Active}
            <!-- No border while animating — clean pulsing dot only -->
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style="background-color: #491EFF; font-size: 11px;"
            >
              <div class="relative flex items-center justify-center">
                <div
                  class="absolute w-6 h-6 rounded-full animate-ping opacity-75"
                  style="background-color: #491EFF;"
                ></div>
                <div
                  class="w-2.5 h-2.5 rounded-full"
                  style="background-color: #dedde2;"
                ></div>
              </div>
            </div>
          {:else}
            <div class="w-6 h-6 rounded-full bg-gray-200 shrink-0"></div>
          {/if}

          <!-- Label -->
          <span
            class={`text-sm font-semibold ${
              step.status === StepStatus.Pending
                ? "text-gray-400"
                : "text-[#491EFF]"
            }`}
          >
            {step.label}
          </span>
        </li>
      {/each}
    </ul>

    <!-- ── SUCCESS VIEW ───────────────────────────────────────────────────── -->
  {:else if currentView === View.Success}
    <!-- Icon + Title -->
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
      <div class="flex-1 bg-gray-100 rounded-xl p-4 text-center">
        <p class="text-2xl font-bold" style="color: #491EFF;">
          {result.assistants}
        </p>
        <p class="text-xs text-gray-500 mt-1">
          {t("self-onboarding.stat-assistants")}
        </p>
      </div>
      <div class="flex-1 bg-gray-100 rounded-xl p-4 text-center">
        <p class="text-2xl font-bold" style="color: #491EFF;">
          {result.pagesAnalysed}
        </p>
        <p class="text-xs text-gray-500 mt-1">
          {t("self-onboarding.stat-pages")}
        </p>
      </div>
      <div class="flex-1 bg-gray-100 rounded-xl p-4 text-center">
        <p class="text-2xl font-bold" style="color: #491EFF;">
          {result.knowledgeBases}
        </p>
        <p class="text-xs text-gray-500 mt-1">{t("self-onboarding.stat-kb")}</p>
      </div>
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
        <span class="text-sm font-bold text-gray-900">{selectedTagTitle}</span>
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
    <button
      type="button"
      class="btn w-full rounded-full py-3 font-bold text-white text-base"
      style="background-color: #3730C7; border-color: #3730C7;"
    >
      {t("self-onboarding.start-btn")} →
    </button>
  {/if}
</div>
