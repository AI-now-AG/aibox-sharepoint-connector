<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import type { TagItem, CategoryItem } from "$types/Subscription";
  import AlertDialog from "$components/AlertDialog.svelte";
  import Input from "$components/form/Input.svelte";
  import SubsciptionSteps from "$components/subscription/SubsciptionSteps.svelte";
  import { useTranslations } from "$i18n/utils";
  import Dropdown from "$components/subscription/Dropdown.svelte";
  import { storeOrganizationInfo, subscription } from "$stores/subscription";
  import { Languges } from "$types/TenantFeature";
  import { posthogClientCaptureWithoutTenant } from "$utils/posthogClient";
  import { EventName, ScreenName } from "$types/Posthog";

  interface Props {
    defaultLanguage?: string;
    tags: TagItem[];
    categories: CategoryItem[];
  }

  let { defaultLanguage = "en", tags = [], categories = [] }: Props = $props();
  const t = useTranslations(defaultLanguage);

  const init = $subscription.organizationInfo;

  let selectedLanguage: string = $state(init?.defaultLanguage ?? "de");

  let organizationName = $state(init?.organizationName ?? "");

  // NEW: single tag only
  let selectedTag: string = $state(init?.selectedTags?.[0] ?? "");

  // categories for selected tag
  const filteredCategories = $derived(
    !selectedTag
      ? []
      : categories.filter((cat) => cat.tags?.includes(selectedTag)),
  );

  // selected categories (auto-set when tag changes)
  let selectedCategories: string[] = $state(init?.selectedCategories ?? []);

  let alertModal: HTMLDialogElement | undefined = $state();
  let alertMessage = $state("");

  function showAlert(message: any) {
    alertMessage = message;
    alertModal?.showModal();
  }

  // Select single tag
  function selectTag(tagId: string) {
    // Unselect tag → clear categories
    if (selectedTag === tagId) {
      selectedTag = "";
      selectedCategories = [];
      return;
    }

    // Select this tag
    selectedTag = tagId;

    // Auto-select categories belonging to this tag
    const autoCategories = categories
      .filter((cat) => cat.tags?.includes(tagId))
      .map((cat) => cat.value);

    selectedCategories = autoCategories;
  }

  // Toggle category checkbox
  function toggleCategory(id: string) {
    if (selectedCategories.includes(id)) {
      selectedCategories = selectedCategories.filter((x) => x !== id);
    } else {
      selectedCategories = [...selectedCategories, id];
    }
  }

  function validateForm() {
    if (!organizationName) {
      showAlert(t("subscription.validate-empty-organization-name-message"));
      return false;
    }

    if (!selectedLanguage) {
      showAlert(t("subscription.validate-empty-language-message"));
      return false;
    }

    if (!selectedTag) {
      showAlert(t("subscription.validate-unselected-tags-message"));
      return false;
    }

    if (selectedCategories.length === 0) {
      showAlert(t("subscription.validate-empty-categories-message"));
      return false;
    }

    return true;
  }

  function handleNext() {
    if (validateForm()) {
      storeOrganizationInfo({
        organizationName,
        defaultLanguage: selectedLanguage || "de",
        selectedTags: selectedTag ? [selectedTag] : [],
        selectedCategories,
      });

      posthogClientCaptureWithoutTenant(EventName.AiboxOnboardingStep1, {
        page_name: ScreenName.OnboardingStep1,
      });

      window.location.href = "/subscription/step2";
    }
  }
</script>

<div class="max-w-5xl mx-auto">
  <!-- mobile steps -->
  <div
    class="bg-[#491EFF] p-4 rounded-lg mb-6 flex md:hidden lg:hidden items-center justify-center"
  >
    <SubsciptionSteps currentStep={2} {defaultLanguage} />
  </div>

  <h1 class="font-sans text-3xl font-bold text-black mt-2">
    {t("subscription.customize-your-aibox")}
  </h1>

  <p class="font-sans text-base font-medium text-gray-600 mt-6 mb-10">
    {t("subscription.customize-your-aibox-description")}
  </p>

  <!-- Form -->
  <div class="w-full mx-auto">
    <div class="block md:flex lg:flex flex-row md:space-x-8 lg:space-x-8">
      <div class="flex-1 flex flex-col mb-4">
        <Input
          id="organization-name"
          label={t("subscription.organization-name")}
          value={organizationName}
          placeholder={t("subscription.organization-name-placeholder")}
          inputChange={(event: any) => (organizationName = event.value)}
          containerClasses="h-[56px] shadow-xl"
          labelClasses="text-sm"
          classes="text-base"
        />
      </div>

      <div class="flex-1 flex flex-col mb-4">
        <Dropdown
          label={`${t("subscription.language")}`}
          placeholder={t("tenant.german-language")}
          options={Languges}
          bind:value={selectedLanguage}
        />
      </div>
    </div>
  </div>

  <!-- TAGS -->
  <div class="font-sans font-bold text-base mt-10 mb-4">
    {t("subscription.choose-categories")}
  </div>

  <div class="mb-6 w-full">
    <div class="flex flex-wrap justify-start w-full gap-3">
      {#each tags as tag}
        <button
          class={`px-6 py-3 rounded-2xl text-sm font-semibold transition border shadow-md
            ${
              selectedTag === tag.value
                ? "bg-primary text-white border-transparent scale-[1.03]"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }
          `}
          onclick={() => selectTag(tag.value)}
        >
          {tag.title}
        </button>
      {/each}
    </div>
  </div>

  <!-- CATEGORIES (checkbox version) -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-10 text-black">
    {#each filteredCategories as category}
      <label
        class={`cursor-pointer flex items-center justify-between w-full h-[64px] px-4 rounded-xl shadow-md ${
          selectedCategories.includes(category.value)
            ? "bg-[#A1E1F8]"
            : "bg-white"
        }`}
        in:fade
        out:fly
      >
        <span class="text-base font-medium">{category.title}</span>

        <input
          type="checkbox"
          class="checkbox checkbox-primary"
          checked={selectedCategories.includes(category.value)}
          onchange={() => toggleCategory(category.value)}
        />
      </label>
    {/each}
  </div>

  <!-- NEXT -->
  <div class="w-full flex items-center justify-end rounded-lg p-4">
    <button
      class="btn btn-active btn-primary min-w-[144px]"
      onclick={handleNext}
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
