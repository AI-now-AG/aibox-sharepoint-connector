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

  const initOrganizationInformation = $subscription.organizationInfo;

  let selectedLanguage: string = $state(
    initOrganizationInformation?.defaultLanguage ?? "de",
  );
  let organizationName = $state(
    initOrganizationInformation?.organizationName ?? "",
  );

  let selectedTags: string[] = $state(
    initOrganizationInformation?.selectedTags ?? [],
  );
  let selectedCategories: string[] = $state(
    initOrganizationInformation?.selectedCategories ?? [],
  );

  const filteredCategories = $derived(
    selectedTags.length === 0
      ? categories
      : categories.filter((cat) =>
          cat.tags?.some((tag) => selectedTags?.includes(tag)),
        ),
  );

  let alertModal: HTMLDialogElement | undefined = $state();
  let alertMessage = $state("");

  $inspect(selectedLanguage);
  $inspect(selectedCategories);

  function showAlert(message: any) {
    alertMessage = message;
    alertModal?.showModal();
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

    if (selectedCategories.length === 0) {
      showAlert(t("subscription.validate-empty-categories-message"));
      return false;
    }

    return true;
  }

  function toggleTag(id: string) {
    const isSelected = selectedTags.includes(id);

    selectedTags = isSelected
      ? selectedTags.filter((t) => t !== id)
      : [...selectedTags, id];

    // remove invalid categories immediately
    const newFiltered =
      selectedTags.length === 0
        ? categories
        : categories.filter((cat) =>
            cat.tags?.some((tag) => selectedTags.includes(tag)),
          );

    selectedCategories = selectedCategories.filter((catId) =>
      newFiltered.some((cat) => cat.value === catId),
    );
  }

  function toggleCategory(id: string) {
    selectedCategories = selectedCategories.includes(id)
      ? selectedCategories.filter((i) => i !== id)
      : [...selectedCategories, id];
  }

  function handleNext() {
    if (validateForm()) {
      storeOrganizationInfo({
        organizationName: organizationName,
        defaultLanguage: selectedLanguage || "de",
        selectedTags,
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
  <div
    class="bg-[#491EFF] p-4 rounded-lg mb-6 flex md:hidden lg:hidden items-center justify-center"
  >
    <SubsciptionSteps currentStep={2} {defaultLanguage} />
  </div>

  <h1 class="font-sanns text-3xl font-bold text-black mt-2">
    {t("subscription.customize-your-aibox")}
  </h1>
  <p class="font-sans text-base font-medium text-gray-600 mt-6 mb-10">
    {t("subscription.customize-your-aibox-description")}
  </p>

  <!-- Form -->
  <div class="w-full mx-auto">
    <div
      class="block md:flex lg:flex flex-row md:space-x-8 space-x-0 lg:space-x-8"
    >
      <div class="flex-1 flex flex-col mb-4">
        <Input
          id="organization-name"
          label={t("subscription.organization-name")}
          value={organizationName}
          placeholder={t("subscription.organization-name-placeholder")}
          inputChange={(event: any) => {
            organizationName = event.value;
          }}
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
  <br class="mt-10" />

  <div class="font-sans font-bold text-base mt-10 mb-6">
    {t("subscription.choose-categories")}
  </div>
  <!-- TAGS -->
  <div class="mb-10">
    <div
      class="flex flex-wrap justify-center max-w-md space-x-2 space-y-2 mx-auto"
    >
      {#each tags as tag}
        <button
          class={`btn btn-sm shadow-md py-2 ${
            selectedTags.includes(tag.value)
              ? "btn-primary"
              : "bg-white text-gray-600 border-0"
          }`}
          onclick={() => toggleTag(tag.value)}
        >
          <span class="w-full text-left py-2">{tag.title}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- CATEGORIES -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-10 text-black">
    {#each filteredCategories as category}
      <button
        class={`btn w-full h-[48px] shadow-xl py-2 ${
          selectedCategories.includes(category.value)
            ? "btn-primary"
            : "bg-white text-gray-600 border-0"
        }`}
        onclick={() => toggleCategory(category.value)}
        in:fade
        out:fly
      >
        <span class="w-full text-left">{category.title}</span>
      </button>
    {/each}
  </div>

  <div class="w-full flex items-center justify-end rounded-lg p-4">
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
