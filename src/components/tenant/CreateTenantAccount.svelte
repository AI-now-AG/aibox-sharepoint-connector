<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import { tenant } from "$stores";
  import {
    BillingMethod,
    CountryCode,
    type AudioOptionId,
    type SubscriptionPackageId,
  } from "$types/Subscription";
  import {
    LanguageCode,
    Languges,
    ThemeCode,
    ThemeMap,
    Themes,
  } from "$types/TenantFeature";
  import type { TagItem, CategoryItem } from "$types/Subscription";
  import { SubscriptionPackages } from "$data/subscription-packages";
  import { useTranslatedCountryList } from "$utils/subscription";
  import Loading from "$components/Loading.svelte";
  import AlertDialog from "$components/AlertDialog.svelte";
  import Input from "$components/form/Input.svelte";
  import Dropdown from "$components/form/Dropdown.svelte";
  import ThemeItem from "./ThemeItem.svelte";
  import TagCategorySelector from "$components/subscription/TagCategorySelector.svelte";
  import SubscriptionPackageList from "$components/subscription/SubscriptionPackageList.svelte";
  import AudioOptionList from "$components/subscription/AudioOptionList.svelte";
  import BillingMethods from "$components/subscription/BillingMethods.svelte";

  interface Props {
    backUrl?: string;
    pageTitle?: string;
    isReseller?: boolean;
    isSomedia?: boolean;
    resellerCode?: string;
    tags: TagItem[];
    categories: CategoryItem[];
  }
  let {
    backUrl,
    pageTitle = "",
    isReseller = false,
    isSomedia = false,
    resellerCode = "",
    tags = [],
    categories = [],
  }: Props = $props();

  let loading = $state(false);
  let alertModal: HTMLDialogElement | undefined = $state();
  let alertMessage = $state("");

  const defaultLanguage = $tenant?.default_language ?? "";
  const countryOptions = useTranslatedCountryList(defaultLanguage);

  let organizationName = $state<string>("");
  let selectedLanguage: string = $state(LanguageCode.De);
  let selectedTheme: { title: string; value: ThemeCode } | undefined = $state(
    ThemeMap[ThemeCode.AIBox],
  );

  let companyName = $state<string>("");
  let street = $state<string>("");
  let zipCode = $state<string>("");
  let location = $state<string>("");
  let contactPhone = $state<string>("");
  let contactName = $state<string>("");
  let country = $state<string>(CountryCode.CH);
  let billingEmail = $state<string>("");
  let billingMethod = $state<BillingMethod>(BillingMethod.MonthlyInvoice);

  let totalPrice: any = $state("");
  let selectedPackageId = $state("");
  let selectedAudioOptionIds: string[] = $state([]);

  let selectedTag: string = $state(""); // single tag only
  let selectedCategories: string[] = $state([]);

  let isFormValid = $derived(
    organizationName.trim() !== "" &&
      companyName.trim() !== "" &&
      street.trim() !== "" &&
      zipCode.trim() !== "" &&
      location.trim() !== "" &&
      contactName.trim() !== "" &&
      billingEmail.trim() !== "" &&
      selectedCategories.length > 0 &&
      selectedPackageId !== "",
  );

  const t = useTranslations();

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

    // Get audio options price (use plan-specific price for AudioToText)
    if (selectedAudioOptionIds.length > 0) {
      selectedAudioOptionIds.forEach((audioOptionId) => {
        let audioOption =
          SubscriptionPackages.audioOptions[
            audioOptionId as keyof typeof SubscriptionPackages.audioOptions
          ];
        if (audioOption) {
          if (
            "prices" in audioOption &&
            audioOption.prices &&
            selectedPackageId &&
            audioOption.prices[
              selectedPackageId as keyof typeof audioOption.prices
            ]
          ) {
            audioOptionsTotalPrice +=
              audioOption.prices[
                selectedPackageId as keyof typeof audioOption.prices
              ];
          } else if ("prices" in audioOption && audioOption.prices) {
            audioOptionsTotalPrice += Math.min(
              ...Object.values(audioOption.prices),
            );
          } else {
            audioOptionsTotalPrice += audioOption?.price || 0;
          }
        }
      });
    }

    totalPrice = String(packagePrice + audioOptionsTotalPrice);
  });

  onMount(() => {
    // onMount()
  });

  async function createOrganization() {
    const { data, error } = await actions.tenantCreation.createOrganization({
      organization_name: organizationName ?? "",
    });

    if (error) throw new Error(t("tenant.create-organization-failed"));
    return data;
  }

  async function setupTenantData(
    organizationId: string,
    organizationName: string,
    organizationDisplayName: string,
  ) {
    const tenantInput = {
      name: organizationDisplayName ?? "",
      org_id: organizationId,
      org_name: organizationName,
      language: selectedLanguage ?? LanguageCode.De,
      theme: selectedTheme?.value ?? ThemeCode.AIBox,
      use_cases: selectedCategories ?? [],
      plan_name: selectedPackageId as SubscriptionPackageId,
      add_ons: selectedAudioOptionIds as AudioOptionId[],
      billing_method: billingMethod,
      totalPrice: totalPrice,
      billing_info: {
        company_name: companyName,
        address: street,
        zip_code: zipCode,
        location: location,
        country: country,
        email: billingEmail,
      },
    };
    const tenantConfig = {
      is_reseller: isReseller,
      is_somedia: isSomedia,
      reseller_code: resellerCode,
    };
    const { data, error } = await actions.tenantCreation.setupTenantData({
      tenant: tenantInput,
      config: tenantConfig,
    });

    console.log("setupTenantData respone", { data, error });

    if (error) throw new Error(t("tenant.setup-tenant-data-failed"));
    return data;
  }

  function validateForm() {
    if (!organizationName) {
      showAlert(t("tenant.validate-empty-display-name-message"));
      return false;
    }

    if (selectedCategories.length === 0) {
      showAlert(t("subscription.validate-empty-categories-message"));
      return false;
    }

    if (!selectedPackageId) {
      showAlert(t("subscription.please-select-package"));
      return false;
    }

    return true;
  }

  async function createTenant() {
    if (validateForm()) {
      try {
        loading = true;
        // Step 1: Create [Auth0] Organization
        const organization = await createOrganization();
        // Step 2: Setup [AIBOX] Tenant
        const tenant = await setupTenantData(
          organization.id,
          organization.name,
          organization.display_name,
        );

        if (tenant) {
          addToast({
            message: t("tenant.create-successful"),
            type: "success",
          });

          if (isReseller) {
            window.location.href = `/reseller/create-tenant?tenantId=${tenant.id}&status=success`;
          } else {
            window.location.href = `/tenant-management/${tenant.id}`;
          }
        }
      } catch (error: any) {
        showAlert(error?.toString());
      } finally {
        loading = false;
      }
    }
  }

  function showAlert(message: string) {
    alertMessage = message;
    alertModal?.showModal();
  }
</script>

<div
  class="container max-w-full mx-auto grid grid-cols-1 md:grid-cols-[1fr_max-content] px-14 sticky bg-base-200 top-0 z-40"
>
  <div class="flex items-center pt-5 pb-2">
    {#if backUrl}
      <button class="mr-4" onclick={() => (window.location.href = backUrl)}>
        {@html svgIcons.back}
      </button>
    {/if}
    <h1 class="text-4xl font-bold">
      {pageTitle}
    </h1>
  </div>
</div>

<div class="px-8 mb-10">
  <div class="container w-full mx-auto p-6">
    <!-- Organization -->
    <div class="p-5 mb-8 bg-base-100 rounded-lg">
      <h2 class="font-sanns text-3xl font-bold text-black mb-6">
        {t("user.organization")}
      </h2>

      <div class="block md:flex flex-row space-x-0 md:space-x-8">
        <div class="flex-1 flex flex-col mb-4">
          <Input
            label={t("subscription.organization-name") + " *"}
            bind:value={organizationName}
            placeholder={t("tenant.tenants.tenant.display-name")}
            labelClasses="font-medium text-sm"
            classes="text-sm w-full"
          />
        </div>
        <div class="flex-1 flex flex-col mb-4"></div>
      </div>

      <div class="block md:flex flex-row space-x-0 md:space-x-8">
        <div class="flex-1 flex flex-col mb-4">
          <Dropdown
            label={`${t("tenant.language")}*`}
            options={Languges}
            bind:value={selectedLanguage}
          />
        </div>

        <div class="flex-1 flex flex-col mb-4">
          {#if !isReseller}
            <ThemeItem
              title={`${t("tenant.theme")}*`}
              placeholder="e.g Light"
              items={Themes}
              bind:selectedItem={selectedTheme}
            />
          {/if}
        </div>
      </div>
    </div>

    <!-- Contact & Billing -->
    <div class="p-5 mb-8 bg-base-100 rounded-lg">
      <h2 class="font-sanns text-3xl font-bold text-black mb-6">
        {t("tenant.subscription-billing")}
      </h2>
      <div class="block md:flex flex-row space-x-0 md:space-x-8">
        <div class="flex-1 flex flex-col mb-4">
          <Input
            id="company-name"
            label={t("subscription.company-name") + " *"}
            bind:value={companyName}
            placeholder={t("subscription.company-name-place-holder")}
            labelClasses="font-medium text-sm"
            classes="text-sm w-full"
          />
        </div>

        <div class="flex-1 flex flex-col mb-4">
          <Input
            id="street-number"
            label={t("subscription.street-number") + " *"}
            bind:value={street}
            placeholder={t("subscription.street-number-placeholder")}
            labelClasses="font-medium text-sm"
            classes="text-sm w-full"
          />
        </div>
      </div>

      <div class="block md:flex flex-row space-x-0 md:space-x-8">
        <div class="flex-1 flex flex-col mb-4">
          <Input
            id="zip-code"
            label={t("subscription.zip-code") + " *"}
            bind:value={zipCode}
            placeholder={t("subscription.zip-code-place-holder")}
            classes="text-sm w-full"
          />
        </div>

        <div class="flex-1 flex flex-col mb-4">
          <Input
            id="location"
            label={t("subscription.location") + " *"}
            bind:value={location}
            placeholder={t("subscription.location-place-holder")}
            labelClasses="font-medium text-sm"
            classes="text-sm w-full"
          />
        </div>
      </div>

      <div class="block md:flex flex-row space-x-0 md:space-x-8">
        <div class="flex-1 flex flex-col mb-4">
          <Input
            id="contact-phone"
            label={t("subscription.contact-phone") + " *"}
            bind:value={contactPhone}
            placeholder={t("subscription.contact-phone-placeholder")}
            labelClasses="font-medium text-sm"
            classes="text-sm w-full"
          />
        </div>

        <div class="flex-1 flex flex-col mb-4">
          <Input
            id="contact-name"
            label={t("subscription.contact-name") + " *"}
            bind:value={contactName}
            placeholder={t("subscription.contact-name-placeholder")}
            labelClasses="font-medium text-sm"
            classes="text-sm w-full"
          />
        </div>
      </div>

      <div
        class="block md:flex lg:flex flex-row md:space-x-8 space-x-0 lg:space-x-8"
      >
        <div class="flex-1 flex flex-col mb-4">
          <Dropdown
            label={`${t("subscription.country")}`}
            options={countryOptions}
            bind:value={country}
            labelClasses="font-medium text-sm"
          />
        </div>
        <div class="flex-1 flex flex-col mb-4">
          <Input
            id="email"
            label={t("subscription.billing-email") + " *"}
            bind:value={billingEmail}
            placeholder={t("subscription.billing-email-plcae-holder")}
            labelClasses="font-medium text-sm"
            classes="text-sm w-full"
          />
        </div>
      </div>

      {#if !isSomedia}
        <div class="divider"></div>

        <p class="font-sans text-base font-medium text-gray-600 mt-6 mb-4">
          {t("subscription.billing-method")}
        </p>
        <BillingMethods
          bind:billingMethod
          availableMethods={[
            BillingMethod.MonthlyInvoice,
            BillingMethod.YearlyInvoice,
          ]}
        />
      {/if}
    </div>

    <!-- Tag Category selector -->
    <div class="p-5 mb-8 bg-base-100 rounded-lg">
      <TagCategorySelector
        {tags}
        {categories}
        {defaultLanguage}
        bind:selectedTag
        bind:selectedCategories
      />
    </div>

    <!-- Package Plans -->
    <div class="p-5 mb-8 bg-base-100 rounded-lg">
      <h2 class="font-sanns text-3xl font-bold text-black mb-10">
        {t("subscription.choose-your-plan")}
      </h2>

      <div
        class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-10 text-black"
      >
        <SubscriptionPackageList bind:selectedPackageId {defaultLanguage} />
      </div>
    </div>

    <!-- Audio to Text Options -->
    <div class="p-5 mb-8 bg-base-100 rounded-lg">
      <h2 class="font-sanns text-3xl font-bold text-black mb-6">
        {t("subscription.audio-to-text-options")}
      </h2>

      <div class="mt-4">
        <AudioOptionList
          bind:selectedAudioOptionIds
          {selectedPackageId}
          {defaultLanguage}
        />
      </div>

      <div class="w-full flex items-center justify-end rounded-lg p-4">
        <p class="text-gray-600 text-right mr-4 font-bold font-inter text-sm">
          {t("subscription.total-price-for-plan", { total: totalPrice })}
        </p>
      </div>
    </div>

    <div class="flex justify-end space-x-2 mt-8">
      <button
        class="btn btn-primary"
        onclick={() => {
          createTenant();
        }}
        disabled={!isFormValid}
      >
        {t("common.save")}
      </button>
    </div>
  </div>
</div>

<AlertDialog bind:modal={alertModal} bind:message={alertMessage} />
<Loading show={loading} />
