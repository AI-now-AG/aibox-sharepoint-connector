<script lang="ts">
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { onMount } from "svelte";
  import log from "$utils/log";
  import { tenant as currentTenant } from "$stores";
  import { addToast } from "$stores/toast";
  import { formatDate, getSubscriptionAddOnName } from "$utils/common";
  import { AudioOptionId, SubscriptionPackageId } from "$types/Subscription";
  import { SubscriptionPackages } from "$data/subscription-packages";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import Loading from "$components/Loading.svelte";
  import TenantSearchFilter from "./TenantSearchFilter.svelte";
  import Pagination from "$components/Pagination.svelte";

  const t = useTranslations();
  let loading = $state(false);

  let tenants: any = $state([]);
  let page: number = $state(1);
  let total: number = $state(0);
  let pageSize: number = $state(5);

  let searchValue: string = $state("");
  let statusFlag: string = $state("");
  let resellerCode: string = $state("");

  let selectedTenant: any = $state(null);
  let confirmUpdateModal: HTMLDialogElement | undefined = $state();
  let confirmDeleteModal: HTMLDialogElement | undefined = $state();

  $inspect(tenants);

  onMount(async () => {
    await fetchTenants();
  });

  const fetchTenants = async () => {
    loading = true;
    const { data, error } = await actions.tenant.list({
      page,
      pageSize,
      searchValue,
      statusFlag,
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
      const response = await fetch("/api/export-tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenants: tenants,
        }),
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
  <h1 class="pt-2 lg:pt-8 text-4xl font-bold">
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

    <div class="dropdown dropdown-end mt-2 lg:mt-8">
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label tabindex="0" class="btn btn-primary font-normal grow-0">
        {@html svgIcons.add}
        {t("tenant.tenants.add-new-tenant")}
      </label>

      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <ul
        tabindex="0"
        class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
      >
        <li>
          <a href="/tenant-management/add">
            {t("tenant.add-empty-tenant")}
          </a>
        </li>
        <li>
          <a href="/tenant-management/clone">
            {t("tenant.clone-from-master-tenant")}
          </a>
        </li>
      </ul>
    </div>
  </div>
</div>

<div class="px-8">
  <div class="container max-w-full mx-auto p-6">
    <TenantSearchFilter
      bind:value={searchValue}
      bind:statusFlag
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
      <h2 class="text-lg font-normal mb-4">
        {t("tenant.tenants.all-tenants", { amount: total })}
      </h2>

      <div class="relative">
        <table
          class="border-separate border-spacing-x-0 min-w-full relative"
          style="font-family:Inter;"
        >
          <thead>
            <tr class="bg-base-300">
              <th class="py-3 px-4 text-left font-bold text-xs uppercase"
                >{t("tenant.tenants.tenant.display-name")}</th
              >
              <th class="py-3 px-4 text-left font-bold text-xs uppercase"
                >{t("tenant.subscription")}</th
              >
              <th class="py-3 px-4 text-left font-bold text-xs uppercase"
                >{"Trial"}</th
              >
              <th class="py-3 px-4 text-left font-bold text-xs uppercase"
                >{"Internal"}</th
              >
              <th class="py-3 px-4 text-left font-bold text-xs uppercase"
                >{t("tenant.total-price")}</th
              >
              <th class="py-3 px-4 text-left font-bold text-xs uppercase"
                >{t("tenant.subscription-start-date")}</th
              >
              <th class="py-3 px-4 text-left font-bold text-xs uppercase"
                >{t("tenant.tenants.tenant.active")}</th
              >
              <th class="py-3 px-4">&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {#each tenants as tenant}
              <tr class="h-16 bg-base-100 hover:bg-base-300 text-sm">
                <td class="py-3 px-4 text-sm font-medium">
                  <a
                    class="underline underline-offset-2"
                    href="/tenant-management/{tenant._id}">{tenant.name}</a
                  >
                </td>

                <td class="py-3 px-4">
                  <span class="block text text-sm font-medium">
                    {tenant.subscription?.plan_name}
                  </span>
                  {#if tenant.subscription?.add_ons}
                    <span class="block pt-1">
                      <span class="badge badge-ghost badge-sm">
                        {getSubscriptionAddOnName(
                          "audiototext",
                          tenant.subscription?.add_ons,
                        )}
                      </span>
                      <span class="badge badge-ghost badge-sm">
                        {getSubscriptionAddOnName(
                          "subtitle",
                          tenant.subscription?.add_ons,
                        )}
                      </span>
                    </span>
                  {/if}
                </td>

                <td class="py-3 px-4">
                  {#if tenant.subscription?.is_trial}
                    <span class="badge badge-soft badge-success">Yes</span>
                  {:else}
                    <span class="badge badge-soft badge-warning">No</span>
                  {/if}
                </td>

                <td class="py-3 px-4">
                  {#if tenant.is_internal}
                    <span class="badge badge-soft badge-success">Yes</span>
                  {:else}
                    <span class="badge badge-soft badge-warning">No</span>
                  {/if}
                </td>

                <td class="py-3 px-4">
                  <span class="text-warning text-sm font-medium"
                    >{tenant.totalPrice
                      ? tenant.totalPrice + " CHF"
                      : calculateTotalPrice(
                          tenant.subscription?.plan_name,
                          tenant.subscription?.add_ons,
                        )}</span
                  >
                </td>

                <td class="py-3 px-4">
                  <span class="text text-sm font-medium">
                    {tenant.subscription?.start_date
                      ? formatDate(
                          tenant.subscription?.start_date,
                          "DD.MM.YYYY",
                        )
                      : "-"}
                  </span>
                </td>

                <td class="py-3 px-4">
                  {#if tenant.active}
                    <span class={"badge badge-soft badge-success badge-sm"}
                      >{t("tenant.tenants.tenant.active")}
                    </span>
                  {:else}
                    <span class={"badge badge-soft badge-ghost badge-sm"}
                      >{t("tenant.tenants.tenant.archived")}
                    </span>
                  {/if}
                </td>

                <td class="py-3 px-4 text-right relative relative-dropdown">
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

      <Pagination
        bind:page
        {pageSize}
        {total}
        onPageChange={handlePageChange}
      />
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
