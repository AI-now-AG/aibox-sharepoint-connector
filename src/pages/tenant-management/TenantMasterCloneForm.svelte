<script lang="ts">
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import AlertDialog from "$components/AlertDialog.svelte";
  import { SubscriptionExtraPackage } from "$types/Subscription";
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

  const t = useTranslations();
  interface Props {
    masterTenantId: string;
  }

  let { masterTenantId }: Props = $props();

  let loading = $state(false);

  let alertModal: HTMLDialogElement | undefined = $state();
  let alertMessage = $state("");

  const headerTitle = t("tenant.clone-from-master-tenant");
  let tenantData = $state<any>({});

  let selectedLanguage: string = $state(LanguageCode.De);
  let selectedThemes: { title: string; value: string } | undefined = $state(
    ThemeMap[ThemeCode.AIBox],
  );

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

  function validateForm() {
    return false;
    // if (!tenantData?.name) {
    //   showAlert(t("tenant.validate-empty-display-name-message"));
    //   return false;
    // }

    // return true;
  }

  async function createTenant() {
    if (validateForm()) {
      try {
        loading = true;
        tenantData.default_language = selectedLanguage;
        tenantData.theme = selectedThemes?.value as ThemeCode;

        const { error, data: createdTenant } = await actions.tenant.create({
          tenant: tenantData,
          subscription: {
            plan_name: SubscriptionExtraPackage.Internal,
            add_ons: [],
          },
        });

        if (error) {
          showAlert(error?.toString());
        } else {
          addToast({
            message: t("tenant.create-successful"),
            type: "success",
          });
          const { insertedId = "" } = createdTenant;
          window.location.href = "/tenant-management/" + insertedId;
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
    alertModal?.show();
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
      {headerTitle}
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
    <div class="flex flex-row space-x-4">
      <div class="flex-1 flex flex-col mb-4">
        <span class="mb-2 text-base-content font-medium text-sm"
          >{t("tenant.tenants.tenant.display-name")}*</span
        >
        <input
          type="text"
          placeholder={t("tenant.tenants.tenant.display-name")}
          class="input input-bordered w-full"
          bind:value={tenantData.name}
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
          bind:selectedItem={selectedThemes}
        />
      </div>
    </div>

    <div class="divider"></div>

    <div class="font-sans font-bold text-base mt-10 mb-6">
      {t("subscription.choose-categories")}
    </div>

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
  </div>
</div>

<AlertDialog bind:modal={alertModal} bind:message={alertMessage} />
<Loading show={loading} />
