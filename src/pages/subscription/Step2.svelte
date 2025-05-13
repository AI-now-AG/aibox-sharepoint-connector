<script lang="ts">
  import AlertDialog from "$components/AlertDialog.svelte";
  import Input from "$components/Input/Input.svelte";
  import SubsciptionSteps from "$components/subscription/SubsciptionSteps.svelte";
  import { useTranslations } from "$i18n/utils";
  import SingleInput from "$pages/prompt-library/prompts/SingleInput.svelte";
  import { storeOrganizationInfo, subscription } from "$stores/subscription";

  interface Props {
    defaultLanguage?: string;
    categories?: any[];
  }
  let { defaultLanguage = "en", categories = $bindable([]) }: Props = $props();
  const t = useTranslations(defaultLanguage);

  const initOrganizationInformation = $subscription.organizationInfo;

  const languages = [
    { title: "Deutsch", value: "de" },
    { title: "English", value: "en" },
  ];

  const initSelectedLanguage = initOrganizationInformation?.defaultLanguage
    ? initOrganizationInformation?.defaultLanguage == "de"
      ? languages[0]
      : languages[1]
    : languages[0];

  let selectedLanguage: { title: string; value: string } =
    $state(initSelectedLanguage);
  let organizationName = $state(
    initOrganizationInformation?.organizationName ?? "",
  );
  let selectedCategories: string[] = $state(
    initOrganizationInformation?.useCases ?? [],
  );

  let alertModal: HTMLDialogElement | undefined = $state();
  let alertMessage = $state("");
  $inspect($subscription);

  function showAlert(message: any) {
    alertMessage = message;
    alertModal?.show();
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

  function handleNext() {
    if (validateForm()) {
      storeOrganizationInfo({
        organizationName: organizationName,
        defaultLanguage: selectedLanguage?.value ?? "de",
        useCases: selectedCategories,
      });
      window.location.href = "/subscription/step3";
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
          labelClasses="text-base-content text-sm"
          classes="text-base"
        />
      </div>

      <div class="flex-1 flex flex-col mb-4">
        <SingleInput
          title={`${t("subscription.language")}`}
          placeholder={t("tenant.german-language")}
          items={languages}
          bind:selectedItem={selectedLanguage}
          labelClasses="h-[56px]"
          titleClasses="mb-3"
        />
      </div>
    </div>
  </div>

  <br class="mt-10" />
  <div class="font-sans font-bold text-base mt-10 mb-6">
    {t("subscription.choose-categories")}
  </div>
  <br class="mb-6" />

  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-10 text-black">
    {#each categories as category}
      {#if selectedCategories.includes(category.value)}
        <button
          class="btn btn-primary w-full h-[56px] shadow-xl py-2"
          onclick={() => {
            selectedCategories = selectedCategories.filter(
              (item) => item !== category.value,
            );
          }}
          ><span class="w-full text-left py-2">
            {category.title}
          </span></button
        >
      {:else}
        <button
          class="btn btn-primary w-full h-[56px] shadow-xl bg-white text-gray-600 py-2 border-0"
          onclick={() => {
            selectedCategories.push(category.value);
          }}
        >
          <span class="w-full text-left py-2"> {category.title} </span></button
        >
      {/if}
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
