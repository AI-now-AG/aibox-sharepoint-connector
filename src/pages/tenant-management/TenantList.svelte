<script lang="ts">
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { onMount } from "svelte";
  import log from "$utils/log";
  import { tenant as currentTenant } from "$stores";
  import { addToast } from "$stores/toast";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import Loading from "$components/Loading.svelte";
  import InputSearchFilter from "./InputSearchFilter.svelte";
  import dayjs from "dayjs";
  import {
    AudioOptionId,
    AudioOptionLabels,
    SubscriptionPackageId,
  } from "$types/Subscription";
  import { SubscriptionPackages } from "$data/subscription-packages";

  const t = useTranslations();
  let loading = $state(false);

  let tenants: any = $state([]);
  let showArchived: boolean = $state(false);
  let searchValue: string = $state("");

  let selectedTenant: any = $state(null);
  let confirmUpdateModal: HTMLDialogElement | undefined = $state();
  let confirmDeleteModal: HTMLDialogElement | undefined = $state();

  onMount(async () => {
    await fetchTenants();
  });

  const fetchTenants = async () => {
    loading = true;
    const { data, error } = await actions.tenant.list({
      searchValue,
      showArchived,
    });

    loading = false;

    if (!error) {
      tenants = data;
    } else {
      log.e(error, "Error fetching tenants");
    }
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

  const getSubscriptionAddOnName = (
    forOption: "audiototext" | "subtitle" = "audiototext",
    planAddOns: Array<any> = [],
  ) => {
    const addOnOptions: Array<any> =
      forOption == "audiototext"
        ? planAddOns.filter((option: any) => {
            return (
              option == AudioOptionId.AudioBasis ||
              option == AudioOptionId.AudioBasisAddOnLarge
            );
          }) || []
        : planAddOns.filter((option: any) => {
            return (
              option == AudioOptionId.AudioBasisAddOnSubtitle ||
              option == AudioOptionId.AudioPremium
            );
          }) || [];
    const firstOption = addOnOptions?.[0] as AudioOptionId | undefined;
    return firstOption ? AudioOptionLabels[firstOption] || "-" : "-";
  };

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
</script>

<div class="container max-w-full mx-auto p-6">
  <InputSearchFilter
    bind:value={searchValue}
    bind:showArchived
    onsearch={fetchTenants}
    onfilter={fetchTenants}
  />

  <div>
    <h2 class="text-lg font-normal mb-4">
      {t("tenant.tenants.all-tenants", { amount: tenants.length })}
    </h2>

    <div class="relative">
      <table
        class="border-separate border-spacing-x-0 border-spacing-y-3 min-w-full relative"
        style="font-family:Inter;"
      >
        <!-- <colgroup>
          <col class="w-auto" />
          <col class="w-80" />
          <col class="w-48" />
          <col class="w-24" />
          <col class="w-16" />
        </colgroup> -->
        <thead>
          <tr class="bg-base-300 rounded-lg">
            <th class="py-3 px-4 text-left font-normal text-xs rounded-l-lg"
              >{t("tenant.tenants.tenant.display-name")}</th
            >
            <th class="py-3 px-4 text-left font-normal text-xs"
              >{t("tenant.subscription")}</th
            >
            <th class="py-3 px-4 text-left font-normal text-xs"
              >{t("tenant.audio-subscription")}</th
            >
            <th class="py-3 px-4 text-left font-normal text-xs"
              >{t("tenant.subtitle-subscription")}</th
            >
            <th class="py-3 px-4 text-left font-normal text-xs"
              >{t("tenant.total-price")}</th
            >
            <th class="py-3 px-4 text-left font-normal text-xs"
              >{t("tenant.subscription-date")}</th
            >
            <th class="py-3 px-4 text-left font-normal text-xs"
              >{t("tenant.tenants.tenant.active")}</th
            >
            <th class="py-3 px-4 rounded-r-lg"></th>
          </tr>
        </thead>
        <tbody>
          {#each tenants as tenant}
            <tr class="h-16 bg-base-100 hover:bg-base-300 text-sm rounded-lg">
              <td class="py-3 px-4 text-sm font-medium rounded-l-lg">
                <a
                  class="underline underline-offset-2"
                  href="/tenant-management/{tenant._id}">{tenant.name}</a
                >
              </td>

              <td class="py-3 px-4">
                <span class="text text-sm font-medium">
                  {tenant.subscription?.plan_name}
                </span>
              </td>

              <td class="py-3 px-4">
                <span class="text text-sm font-medium">
                  {getSubscriptionAddOnName(
                    "audiototext",
                    tenant.subscription?.add_ons,
                  )}
                </span>
              </td>

              <td class="py-3 px-4">
                <span class="text text-sm font-medium">
                  {getSubscriptionAddOnName(
                    "subtitle",
                    tenant.subscription?.add_ons,
                  )}
                </span>
              </td>

              <td class="py-3 px-4">
                <span class="text-warning text-sm font-medium"
                  >{calculateTotalPrice(
                    tenant.subscription?.plan_name,
                    tenant.subscription?.add_ons,
                  )}</span
                >
              </td>

              <td class="py-3 px-4">
                <span class="text text-sm font-medium">
                  {tenant.subscription?.subscription_date
                    ? dayjs(
                        tenant.subscription?.subscription_date,
                        "DD.MM.YYYY",
                      ).format("DD.MM.YYYY")
                    : "-"}
                </span>
              </td>

              <td class="py-3 px-4">
                <span
                  class={tenant.active == 1
                    ? "text-success text-sm font-medium"
                    : "text-sm font-medium text-neutral/70"}
                  >{tenant.active == 1
                    ? t("tenant.tenants.tenant.active")
                    : t("tenant.tenants.tenant.archived")}</span
                >
              </td>

              <td
                class="py-3 px-4 text-right relative relative-dropdown rounded-r-lg"
              >
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
