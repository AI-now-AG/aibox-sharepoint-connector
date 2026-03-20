<script lang="ts">
  import type { TagItem } from "$types/Subscription";
  import { useTranslations } from "$i18n/utils";
  import { bgOpacity } from "$utils/common";
  import { isValidUrl } from "$utils/validation";

  interface Props {
    tags: TagItem[];
    organizationName: string;
    websiteUrl: string;
    selectedTag: string;
    oncreate: () => void;
    oncheckindustry: () => Promise<void>;
  }

  let {
    tags = [],
    organizationName = $bindable(""),
    websiteUrl = $bindable(""),
    selectedTag = $bindable(""),
    oncreate,
    oncheckindustry,
  }: Props = $props();

  const t = useTranslations();

  const defaultTagIconColor = "#491EFF";
  const defaultTagEmoji = "🏢";

  let showIndustryPicker = $state(false);
  let checkingIndustry = $state(false);
  let industryDetected = $state(false);
  let checkError = $state<string | null>(null);
  // Frozen at detection time — unaffected by manual tag selection afterwards
  let detectedTagTitle = $state("");

  // Show the button when URL is valid; reset detected state if URL changes
  const hasValidUrl = $derived(
    websiteUrl.trim().length > 0 && isValidUrl(websiteUrl),
  );

  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    websiteUrl; // track dependency
    industryDetected = false;
    detectedTagTitle = "";
    checkError = null;
  });

  async function handleCheckIndustry() {
    checkingIndustry = true;
    checkError = null;
    try {
      await oncheckindustry();
      // Snapshot the resolved title before the user can change selectedTag manually
      detectedTagTitle =
        tags.find((tag) => tag.value === selectedTag)?.title ?? "";
      industryDetected = true;
      showIndustryPicker = true; // open picker so user can review / change
    } catch (err) {
      checkError =
        err instanceof Error
          ? err.message
          : t("self-onboarding.error-analyse-website");
    } finally {
      checkingIndustry = false;
    }
  }

  // org name required; URL optional but must be valid when provided
  const canCreate = $derived(
    organizationName.trim().length > 0 &&
      (websiteUrl.trim() === "" || isValidUrl(websiteUrl)) &&
      selectedTag,
  );

  function selectTag(tagId: string) {
    selectedTag = selectedTag === tagId ? "" : tagId;
  }
</script>

<!-- Header -->
<div class="flex items-center gap-3 mb-2">
  <img src="/favicon.svg" alt="aibox" class="w-9 h-9 rounded-lg" />
  <h1 class="text-2xl font-bold text-gray-900">
    {t("self-onboarding.card-title")}
  </h1>
</div>

<p class="text-sm text-gray-500 mb-7">{t("self-onboarding.card-subtitle")}</p>

<!-- Organisation name -->
<div class="mb-5">
  <label for="org-name" class="block text-sm font-semibold text-gray-900 mb-2">
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
    disabled={checkingIndustry}
    bind:value={websiteUrl}
  />
</div>

<p class="text-xs text-gray-400 mt-2 mb-3">
  {t("self-onboarding.website-hint")}
</p>

<!-- Check your industry button -->
{#if hasValidUrl && !industryDetected}
  <button
    type="button"
    class="btn btn-sm rounded-full font-semibold mb-4"
    style="background-color: #491EFF; border-color: #491EFF; color: white;"
    disabled={checkingIndustry}
    onclick={handleCheckIndustry}
  >
    {#if checkingIndustry}
      <span class="loading loading-spinner loading-xs"></span>
    {/if}
    {t("self-onboarding.check-industry-btn")}
  </button>
{/if}

<!-- Industry detection error -->
{#if checkError}
  <p class="text-xs text-red-500 mb-3">{checkError}</p>
{/if}

<!-- Industry detected success banner -->
{#if industryDetected && detectedTagTitle}
  <div
    class="flex items-center gap-3 rounded-xl border px-4 py-3 mb-4"
    style="background-color: #EEF2FF; border-color: #818CF8;"
  >
    <div
      class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
      style="background-color: #491EFF;"
    >
      <svg
        class="w-3 h-3 text-white"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"
        ></path>
      </svg>
    </div>
    <p class="text-sm text-gray-700">
      {t("self-onboarding.industry-detected", { industry: detectedTagTitle })}
    </p>
  </div>
{/if}

<!-- Manual industry picker toggle -->
<button
  type="button"
  class="flex items-center gap-1.5 text-[#491EFF] font-medium text-sm mb-5 hover:underline cursor-pointer"
  onclick={() => (showIndustryPicker = !showIndustryPicker)}
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
                  <img src={tag.icon} alt="" class="w-5 h-5 object-contain" />
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
  class="btn w-full rounded-full py-3 font-bold text-white text-base transition-opacity"
  style="background-color: #3730C7; border-color: #3730C7; {!canCreate
    ? 'opacity: 0.4; cursor: not-allowed;'
    : ''}"
  disabled={!canCreate}
  onclick={oncreate}
>
  {t("self-onboarding.create-btn")}
</button>
