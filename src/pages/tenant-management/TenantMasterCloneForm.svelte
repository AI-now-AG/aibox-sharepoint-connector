<script lang="ts">
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import AlertDialog from "$components/AlertDialog.svelte";
  import Dropdown from "$components/form/Dropdown.svelte";
  import ThemeItem from "./ThemeItem.svelte";
  import {
    LanguageCode,
    Languges,
    ThemeCode,
    ThemeMap,
    Themes,
  } from "$types/TenantFeature";
  import { onMount } from "svelte";
  import SubscriptionPackageList from "$components/subscription/SubscriptionPackageList.svelte";
  import AudioOptionList from "$components/subscription/AudioOptionList.svelte";
  import { SubscriptionPackages } from "$data/subscription-packages";
  import type {
    AudioOptionId,
    SubscriptionPackageId,
  } from "$types/Subscription";

  const t = useTranslations();
  interface Props {
    masterTenantId: string;
  }
  let { masterTenantId }: Props = $props();

  let loading = $state(false);
  let alertModal: HTMLDialogElement | undefined = $state();
  let alertMessage = $state("");

  let organizationName = $state<string>("");
  let selectedLanguage: string = $state(LanguageCode.De);
  let selectedTheme: { title: string; value: ThemeCode } | undefined = $state(
    ThemeMap[ThemeCode.AIBox],
  );

  let totalPrice: any = $state("");
  let selectedPackageId = $state("");
  let selectedAudioOptionIds: string[] = $state([]);

  let categories: any[] = $state([]);
  let selectedCategories: string[] = $state([]);

  onMount(async () => {
    try {
      loading = true;
      const { error, data } = await actions.category.listByTenant({
        _id: masterTenantId,
      });

      if (error) {
        showAlert(error?.toString());
      } else {
        data.forEach((category: any) => {
          categories.push({
            title: category.title,
            value: category._id.toString(),
          });
        });
      }
    } catch (error: any) {
      showAlert(error?.toString());
    } finally {
      loading = false;
    }
  });

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

    // Get audio options price
    if (selectedAudioOptionIds.length > 0) {
      selectedAudioOptionIds.forEach((audioOptionId) => {
        let audioOption =
          SubscriptionPackages.audioOptions[
            audioOptionId as keyof typeof SubscriptionPackages.audioOptions
          ];
        if (audioOption) {
          audioOptionsTotalPrice += audioOption?.price || 0;
        }
      });
    }

    totalPrice = String(packagePrice + audioOptionsTotalPrice);
  });

  async function createOrganization() {
    const { data, error } = await actions.cloneMasterTenant.createOrganization({
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
    const { data, error } = await actions.cloneMasterTenant.setupTenantData({
      name: organizationDisplayName ?? "",
      org_id: organizationId,
      org_name: organizationName,
      language: selectedLanguage ?? LanguageCode.De,
      theme: selectedTheme?.value ?? ThemeCode.AIBox,
      use_cases: selectedCategories ?? [],
      plan_name: selectedPackageId as SubscriptionPackageId,
      add_ons: selectedAudioOptionIds as AudioOptionId[],
      totalPrice: totalPrice,
    });

    console.log("setupTenantData error", error);

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
          window.location.href = "/tenant-management/" + tenant.id;
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
    <button
      class="mr-4"
      onclick={() => (window.location.href = "/tenant-management")}
    >
      {@html svgIcons.back}
    </button>
    <h1 class="text-4xl font-bold">
      {t("tenant.clone-from-master-tenant")}
    </h1>

    <div class="flex space-x-2 ml-auto">
      <button
        class="btn btn-primary"
        onclick={() => {
          createTenant();
        }}
      >
        {t("common.save")}
      </button>
      <button
        class="btn btn-outline"
        onclick={() => (window.location.href = "/tenant-management")}
      >
        {t("common.cancel")}
      </button>
    </div>
  </div>
</div>

<div class="px-8 mb-10">
  <div class="container w-full mx-auto p-6">
    <h1 class="font-sanns text-3xl font-bold text-black mt-6 mb-6">
      {t("user.organization")}
    </h1>

    <div class="flex flex-row space-x-4">
      <div class="flex-1 flex flex-col mb-4">
        <span class="mb-2 text-base-content font-medium text-sm"
          >{t("tenant.tenants.tenant.display-name")}*</span
        >
        <input
          type="text"
          placeholder={t("tenant.tenants.tenant.display-name")}
          class="input input-bordered w-full"
          bind:value={organizationName}
        />
      </div>
      <div class="flex-1 flex flex-col mb-4"></div>
    </div>

    <div class="flex flex-row space-x-4">
      <div class="flex-1 flex flex-col mb-4">
        <Dropdown
          label={`${t("tenant.language")}*`}
          options={Languges}
          bind:value={selectedLanguage}
        />
      </div>

      <div class="flex-1 flex flex-col mb-4">
        <ThemeItem
          title={`${t("tenant.theme")}*`}
          placeholder="e.g Light"
          items={Themes}
          bind:selectedItem={selectedTheme}
        />
      </div>
    </div>

    <div class="divider"></div>

    <h1 class="font-sanns text-3xl font-bold text-black mt-6 mb-10">
      {t("tenant.choose-categories")}
    </h1>

    <div
      class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-10 text-black"
    >
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
            <span class="w-full text-left py-2">
              {category.title}
            </span></button
          >
        {/if}
      {/each}
    </div>

    <div class="divider"></div>

    <!-- Pakage Plan -->
    <h1 class="font-sanns text-3xl font-bold text-black mt-6 mb-10">
      {t("subscription.choose-your-plan")}
    </h1>

    <div
      class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-10 text-black"
    >
      <SubscriptionPackageList
        bind:selectedPackageId
        defaultLanguage={selectedLanguage}
      />
    </div>

    <!-- Audio to Text Options -->
    <h1 class="font-sanns text-3xl font-bold text-black mt-6 mb-8">
      {t("subscription.audio-to-text-options")}
    </h1>

    <div class="mt-4">
      <AudioOptionList
        bind:selectedAudioOptionIds
        defaultLanguage={selectedLanguage}
      />
    </div>

    <div class="w-full flex items-center justify-end rounded-lg p-4">
      <p class="text-gray-600 text-right mr-4 font-bold font-inter text-sm">
        {t("subscription.total-price-for-plan", { total: totalPrice })}
      </p>
    </div>
  </div>
</div>

<AlertDialog bind:modal={alertModal} bind:message={alertMessage} />
<Loading show={loading} />
