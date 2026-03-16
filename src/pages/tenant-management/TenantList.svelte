<script lang="ts">
  import { actions } from "astro:actions";
  import { navigate } from "astro:transitions/client";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { onMount } from "svelte";
  import log from "$utils/log";
  import { tenant as currentTenant } from "$stores";
  import { addToast } from "$stores/toast";
  import { tenantFilters } from "$stores/tenantFilters";
  import { formatDate } from "$utils/common";
  import { getSubscriptionAddOnName } from "$utils/subscription";
  import {
    AudioOptionId,
    SubscriptionPackageId,
    BillingMethod,
    BillingMethodLabels,
  } from "$types/Subscription";
  import { SubscriptionPackages } from "$data/subscription-packages";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import Loading from "$components/Loading.svelte";
  import TenantSearchFilter from "./TenantSearchFilter.svelte";
  import Pagination from "$components/Pagination.svelte";

  interface Props {
    resellerCodes: string[];
  }

  let { resellerCodes = [] }: Props = $props();

  const t = useTranslations();
  let loading = $state(false);

  let tenants: any = $state([]);
  let page: number = $state(1);
  let total: number = $state(0);
  let pageSize: number = $state(20);

  const from = $derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
  const to = $derived(Math.min(page * pageSize, total));

  let searchValue: string = $state("");
  let statusFlags: string[] = $state([]);
  let resellerCode: string = $state("");

  let selectedTenant: any = $state(null);
  let confirmUpdateModal: HTMLDialogElement | undefined = $state();
  let confirmDeleteModal: HTMLDialogElement | undefined = $state();

  const resellerCodeOptions = resellerCodes.map((c) => ({
    title: c,
    value: c,
  }));

  onMount(async () => {
    searchValue = $tenantFilters.searchValue;
    statusFlags = $tenantFilters.statusFlags;
    resellerCode = $tenantFilters.resellerCode;

    await fetchTenants();
  });

  $effect(() => {
    tenantFilters.set({
      searchValue,
      statusFlags,
      resellerCode,
    });
  });

  const fetchTenants = async () => {
    loading = true;
    const { data, error } = await actions.tenant.list({
      page,
      pageSize,
      searchValue,
      statusFlags,
      resellerCode,
    });

    loading = false;

    if (!error) {
      tenants = data.data;
      total = data.total;
    } else {
      log.e(error, "Error fetching tenants");
    }
  };

  const handlePageChange = (p: number) => {
    page = p;
    fetchTenants();
  };

  function confirmUpdateStatus(tenant: any) {
    selectedTenant = tenant;
    confirmUpdateModal?.showModal();
  }

  const updateStatus = async () => {
    const { active } = selectedTenant;
    confirmUpdateModal?.close();

    loading = true;
    let result;
    if (active) {
      result = await actions.tenant.archive({
        _id: selectedTenant._id,
      });
    } else {
      result = await actions.tenant.active({
        _id: selectedTenant._id,
      });
    }
    loading = false;

    const { data, error } = result;
    if (!error) {
      fetchTenants();
    } else {
      log.e(error, "Error updating tenant status");
    }
  };

  function confirmDelete(tenant: any) {
    selectedTenant = tenant;
    confirmDeleteModal?.showModal();
  }

  async function deleteTenant() {
    const { _id } = selectedTenant;
    let result = await actions.tenant.delete({
      _id,
    });
    loading = false;
    const { error } = result;
    if (!error) {
      addToast({
        message: t("tenant.delete-successful"),
        type: "success",
      });
      await fetchTenants();

      // Log out the user if the current tenant being deleted matches the current tenant
      if (selectedTenant._id == $currentTenant?._id) {
        window.location.href = "/api/logout";
      }
    } else {
      addToast({
        message: t("tenant.delete-failed"),
        type: "error",
      });
    }
  }

  const calculateTotalPrice = (
    selectedPlan: SubscriptionPackageId,
    planAddOns: Array<any> = [],
  ) => {
    const selectedAudioToTextOptions =
      planAddOns.filter((option: any) => {
        return (
          option == AudioOptionId.AudioBasis ||
          option == AudioOptionId.AudioBasisAddOnLarge
        );
      }) || [];
    const selectedSubtitleStudioOptions =
      planAddOns.filter((option: any) => {
        return (
          option == AudioOptionId.AudioBasisAddOnSubtitle ||
          option == AudioOptionId.AudioPremium
        );
      }) || [];

    let packagePrice = 0;
    let audioOptionsTotalPrice = 0;

    // Get package price
    if (selectedPlan) {
      let selectedPackage =
        SubscriptionPackages.plan[
          selectedPlan as keyof typeof SubscriptionPackages.plan
        ];
      if (selectedPackage) {
        packagePrice = selectedPackage?.price || 0;
      }
    }

    // Get audio options price
    if (selectedAudioToTextOptions.length > 0) {
      selectedAudioToTextOptions.forEach((audioOptionId) => {
        let audioOption =
          SubscriptionPackages.audioOptions[
            audioOptionId as keyof typeof SubscriptionPackages.audioOptions
          ];
        if (audioOption) {
          audioOptionsTotalPrice += audioOption?.price || 0;
        }
      });
    }

    // Get audio options price
    if (selectedSubtitleStudioOptions.length > 0) {
      selectedSubtitleStudioOptions.forEach((audioOptionId) => {
        let audioOption =
          SubscriptionPackages.audioOptions[
            audioOptionId as keyof typeof SubscriptionPackages.audioOptions
          ];
        if (audioOption) {
          audioOptionsTotalPrice += audioOption?.price || 0;
        }
      });
    }

    return packagePrice + audioOptionsTotalPrice == 0
      ? "-"
      : String(packagePrice + audioOptionsTotalPrice) + " CHF";
  };

  async function exportTenants() {
    try {
      loading = true;
      const response = await fetch("/api/tenants/export", {
        method: "POST",
      });
      loading = false;

      if (!response.ok) throw new Error("Export Tenants failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tenants-Export-${formatDate(new Date(), "DD.MM.YYYY HH-mm-ss")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      addToast({
        message: err,
        type: "error",
      });
      console.error(err);
    }
  }
</script>

<div
  class="container max-w-full mx-auto grid grid-cols-1 md:grid-cols-[1fr_max-content] px-14"
>
  <h1 class="text-4xl font-bold">
    {t("tenant.tenants")}
  </h1>
  <div>
    <button
      class="btn btn-default btn-outline font-normal grow-0"
      data-astro-prefetch="false"
      onclick={exportTenants}
    >
      {@html svgIcons.fileExport}
      {t("prompt-library.prompts.export")}
    </button>

    <button
      onclick={() => navigate("/tenant-management/create")}
      class="btn btn-primary font-normal"
    >
      {@html svgIcons.add}
      {t("tenant.tenants.add-new-tenant")}
    </button>
  </div>
</div>

<div class="px-8">
  <div class="max-w-full mx-auto p-6">
    <TenantSearchFilter
      {resellerCodeOptions}
      bind:value={searchValue}
      bind:statusFlags
      bind:resellerCode
      onsearch={() => {
        page = 1;
        fetchTenants();
      }}
      onfilter={() => {
        page = 1;
        fetchTenants();
      }}
    />

    <div>
      <div class="overflow-x-auto relative">
        <table
          class="table table-fixed border-separate border-spacing-x-0 min-w-full relative"
          style="font-family:Inter;"
        >
          <colgroup>
            <col class="w-auto min-w-[150]" />
            <col class="w-[200]" />
            <col class="w-[180]" />
            <col class="w-[100]" />
            <col class="w-[150]" />
            <col class="w-[120]" />
            <col class="w-[180]" />
            <col class="w-[100]" />
            <col class="w-[80]" />
            <col class="w-[70]" />
          </colgroup>
          <thead>
            <tr class="bg-base-300">
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("tenant.tenants.tenant.display-name")}</th
              >
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("tenant.company")}</th
              >
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("tenant.subscription")}</th
              >
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("tenant.flags")}</th
              >
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("tenant.filter-reseller-code-label")}</th
              >
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("tenant.start-date")}</th
              >
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("tenant.billing-method")}</th
              >
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("tenant.total-price")}</th
              >
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("tenant.tenants.tenant.active")}</th
              >
              <th class="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {#each tenants as tenant}
              {@const subscription = tenant.subscription || null}
              {@const audioAddOn = getSubscriptionAddOnName(
                "audiototext",
                tenant.subscription?.add_ons,
              )}
              {@const subtitleAddOn = getSubscriptionAddOnName(
                "subtitle",
                tenant.subscription?.add_ons,
              )}
              <tr class="h-12 bg-base-100 hover:bg-base-300/30 text-sm">
                <td class="py-2 px-4 text-sm font-medium">
                  <a
                    class="hover:underline hover:underline-offset-2"
                    href="/tenant-management/{tenant._id}">{tenant.name}</a
                  >
                </td>

                <td class="py-2 px-4 text-sm font-medium">
                  {tenant?.billing_info?.company_name || "-"}
                </td>

                <td class="py-2 px-4">
                  <div class="flex flex-col gap-1">
                    <span class="text-sm font-medium">
                      {subscription?.plan_name}
                    </span>
                    {#if audioAddOn || subtitleAddOn}
                      <div class="flex flex-wrap gap-1">
                        {#if audioAddOn}
                          <span class="badge badge-ghost badge-sm whitespace-nowrap">
                            {audioAddOn}
                          </span>
                        {/if}
                        {#if subtitleAddOn}
                          <span class="badge badge-ghost badge-sm whitespace-nowrap">
                            {subtitleAddOn}
                          </span>
                        {/if}
                      </div>
                    {/if}
                  </div>
                </td>

                <td class="py-2 px-4">
                  <span class="flex flex-col gap-2">
                    {#if tenant.is_internal}
                      <span class="badge badge-sm badge-soft badge-success"
                        >{"Internal"}</span
                      >
                    {/if}
                    {#if subscription?.is_trial}
                      <span class="badge badge-sm badge-soft badge-warning"
                        >{"Trial"}</span
                      >
                    {/if}
                    {#if tenant.is_reseller}
                      <span class="badge badge-sm badge-soft badge-info"
                        >{"Reseller"}</span
                      >
                    {/if}
                  </span>
                </td>

                <td class="py-2 px-4">
                  {tenant.owned_by_reseller}
                </td>

                <td class="py-2 px-4">
                  {subscription?.is_trial
                    ? formatDate(subscription.trial_start_date) || "-"
                    : formatDate(subscription.start_date) || "-"}
                </td>

                <td class="py-2 px-4">
                  {tenant.billing_method
                    ? BillingMethodLabels[
                        tenant.billing_method as BillingMethod
                      ]
                    : ""}
                </td>

                <td class="py-2 px-4">
                  <span class="text-warning text-sm font-medium"
                    >{tenant.totalPrice
                      ? tenant.totalPrice + " CHF"
                      : calculateTotalPrice(
                          subscription?.plan_name,
                          subscription?.add_ons,
                        )}</span
                  >
                </td>

                <td class="py-2 px-4">
                  {#if tenant.active}
                    <span class={"badge badge-soft badge-success badge-sm"}
                      >{t("tenant.tenants.tenant.active")}
                    </span>
                  {:else}
                    <span class={"badge badge-soft badge-error badge-sm"}
                      >{t("tenant.tenants.tenant.archived")}
                    </span>
                  {/if}
                </td>

                <td class="py-2 px-4 text-right relative relative-dropdown">
                  <div class="dropdown dropdown-hover dropdown-end">
                    <button class="btn btn-ghost btn-sm z-50">
                      {@html svgIcons.threeDot}
                    </button>
                    <ul
                      class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
                    >
                      <li>
                        <button
                          class="flex block w-full text-left px-4 py-2 text-sm hover:underline"
                          onclick={() => confirmUpdateStatus(tenant)}
                        >
                          {@html tenant.active == 1
                            ? svgIcons.archive
                            : svgIcons.active}
                          <span class="ml-1"
                            >{tenant.active == 1
                              ? t("tenant.tenants.tenant.action.archive")
                              : t("tenant.tenants.tenant.action.active")}</span
                          >
                        </button>
                      </li>
                      {#if !tenant.active}
                        <li>
                          <button
                            class="flex block w-full text-left px-4 py-1 text-sm hover:underline"
                            onclick={() => confirmDelete(tenant)}
                          >
                            {@html svgIcons.trash}
                            <span class="ml-1">{t("common.delete")}</span>
                          </button>
                        </li>
                      {/if}
                      <li>
                        <a
                          class="flex block w-full text-left px-4 py-1 text-sm hover:underline"
                          href="/tenant-management/{tenant._id}"
                        >
                          {@html svgIcons.edit}
                          <span class="ml-1"
                            >{t("tenant.tenants.tenant.action.edit")}</span
                          >
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>

        <Loading show={loading} partial={true} />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-[1fr_max-content]">
        <div class="mt-4 text-sm text-base-content/60">
          {t("pagination.showing-range-of-total", { from, to, total })}
        </div>
        <Pagination
          bind:page
          {pageSize}
          {total}
          onPageChange={handlePageChange}
        />
      </div>
    </div>

    <!-- confirm update dialog -->
    <ConfirmDialog
      bind:modal={confirmUpdateModal}
      confirm={updateStatus}
      description={selectedTenant?.active
        ? t("tenant.tenants.tenant.archive-confirmation")
        : t("tenant.tenants.tenant.active-confirmation")}
    />

    <!-- confirm delete dialog -->
    <ConfirmDialog
      bind:modal={confirmDeleteModal}
      confirm={deleteTenant}
      description={t("tenant.delete-confirm-message")}
    />
  </div>
</div>
