<script lang="ts">
  import type { TagItem, CategoryItem } from "$types/Subscription";
  import AlertDialog from "$components/AlertDialog.svelte";
  import Input from "$components/form/Input.svelte";
  import SubsciptionSteps from "$components/subscription/SubsciptionSteps.svelte";
  import TagCategorySelector from "$components/subscription/TagCategorySelector.svelte";
  import { useTranslations } from "$i18n/utils";
  import Dropdown from "$components/subscription/Dropdown.svelte";
  import { storeOrganizationInfo, subscription } from "$stores/subscription";
  import { LanguageCode, Languges } from "$types/TenantFeature";
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

  let selectedLanguage: string = $state(
    init?.defaultLanguage ?? LanguageCode.De,
  );

  let organizationName = $state(init?.organizationName ?? "");

  let selectedTag: string = $state(init?.selectedTags?.[0] ?? ""); // single tag only
  let selectedCategories: string[] = $state(init?.selectedCategories ?? []); //  (auto-set when tag changes)

  let alertModal: HTMLDialogElement | undefined = $state();
  let alertMessage = $state("");

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
        defaultLanguage: selectedLanguage || LanguageCode.De,
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

  <!-- TAGS & CATEGORIES -->
  <div class="font-sans font-bold text-base mt-10 mb-4">
    {t("subscription.choose-categories")}
  </div>

  <TagCategorySelector
    {tags}
    {categories}
    bind:selectedTag
    bind:selectedCategories
  />

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
