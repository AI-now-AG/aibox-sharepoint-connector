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
  import { loading, showLoading, hideLoading } from "$stores";

  const t = useTranslations();

  let tenants: any = [];
  let showArchived: boolean = false;
  let searchValue: string = "";
  let timeout: any;

  let selectedTenant:any = null;
  let confirmUpdateModal: HTMLDialogElement;
  let confirmDeleteModal: HTMLDialogElement;

  onMount(async () => {
    await fetchTenants();
  });

  const fetchTenants = async () => {
    showLoading();
    const { data, error } = await actions.tenant.list({
      searchValue,
      showArchived,
    });
    hideLoading();

    if (!error) {
      tenants = data;
    } else {
      log.e(error, "Error fetching tenants");
    }
  };

  const copyName = (name:string) => {
    navigator.clipboard.writeText(name).then(
      function () {
        addToast({
          message: "Copied to clipboard: " + name,
          type: "success",
        });
      },
      function (err) {
        console.error("Could not copy text: ", err);
      },
    );
  };

  function confirmUpdateStatus(tenant:any) {
    selectedTenant = tenant;
    confirmUpdateModal?.show();
  }

  const updateStatus = async () => {
    const { active } = selectedTenant;
    log.d(selectedTenant, "updateStatus");
    confirmUpdateModal?.close();

    showLoading();
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
    hideLoading();

    const { data, error } = result;
    log.d(result, "updateStatus --> result");
    if (!error) {
      fetchTenants();
    } else {
      log.e(error, "Error updating tenant status");
    }
  };

  function confirmDelete(tenant:any) {
    selectedTenant = tenant;
    confirmDeleteModal?.show();
  }

  async function deleteTenant() {
    const { _id = "" } = selectedTenant;
    let result = await actions.tenant.delete({
      _id,
    });
    hideLoading();
    const { error } = result;
    if (!error) {
      addToast({
        message: t("tenant.delete-successful"),
        type: "success",
      });
      await fetchTenants();

      // Log out the user if the current tenant being deleted matches the current tenant
      console.log('deleteTenant', {selectedTenant, $currentTenant});
      if (selectedTenant._id == $currentTenant._id) {
        window.location.href = "/api/logout";
      }
    } else {
      addToast({
        message: t("tenant.delete-failed"),
        type: "error",
      });
    }
  }
</script>

<div class="container max-w-full mx-auto p-6">
  <InputSearchFilter bind:value={searchValue} on:search={fetchTenants} bind:showArchived={showArchived} on:filter={fetchTenants} />

  <div>
    <h2 class="text-lg font-normal mb-4">
      {t("tenant.tenants.all-tenants", { amount: tenants.length })}
    </h2>

    <div class="relative">
      <table
        class="border-separate border-spacing-x-0 border-spacing-y-3 min-w-full relative"
        style="font-family:Inter;"
      >
        <colgroup>
          <col class="w-auto" />
          <col class="w-80" />
          <col class="w-48" />
          <col class="w-24" />
          <col class="w-16" />
        </colgroup>
        <thead>
          <tr class="bg-base-300 rounded-lg">
            <th class="py-3 px-4 text-left font-normal text-xs rounded-l-lg"
              >{t("tenant.tenants.tenant.display-name")}</th
            >
            <th class="py-3 px-4 text-left font-normal text-xs"
              >{t("tenant.tenants.tenant.name")}</th
            >
            <th class="py-3 px-4 text-left font-normal text-xs"
              >{t("tenant.tenants.tenant.date-added")}</th
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
              <td
                class="py-3 px-4 text-gray-600 flex items-center text-xs font-normal h-16"
              >
                {tenant.org_name}
                <button
                  class="mx-1 self-center"
                  on:click={() => copyName(tenant.org_name)}
                  >{@html svgIcons.copy}</button
                >
              </td>
              <td class="py-3 px-4 text-sm font-medium">{tenant.created_at}</td>
              <td class="py-3 px-4">
                <span
                  class={tenant.active == 1
                    ? "text-emerald-600 text-sm font-medium"
                    : "text-grey-600 text-sm font-medium"}
                  >{tenant.active == 1
                    ? t("tenant.tenants.tenant.active")
                    : t("tenant.tenants.tenant.archived")}</span
                >
              </td>
              <td
                class="py-3 px-4 text-right relative relative-dropdown rounded-r-lg"
              >
                <div class="dropdown dropdown-hover dropdown-end">
                  <button tabindex="0" class="btn btn-ghost btn-sm z-50">
                    {@html svgIcons.threeDot}
                  </button>
                  <ul
                    class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                  >
                    <li>
                      <button
                        class="flex block w-full text-left px-4 py-2 text-sm hover:underline"
                        on:click={() => confirmUpdateStatus(tenant)}
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
                        on:click={() => confirmDelete(tenant)}
                      >
                        {@html svgIcons.trash}
                        <span class="ml-1"
                          >{t("common.delete")}</span
                        >
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

      <Loading partial={true} bind:show={$loading} />
    </div>
  </div>

  <!-- confirm update dialog -->
  <ConfirmDialog
    bind:modal={confirmUpdateModal}
    on:confirm={updateStatus}
    description={selectedTenant?.active
      ? t("tenant.tenants.tenant.archive-confirmation")
      : t("tenant.tenants.tenant.active-confirmation")}
  />

  <!-- confirm delete dialog -->
  <ConfirmDialog
    bind:modal={confirmDeleteModal}
    on:confirm={deleteTenant}
    description={t('tenant.delete-confirm-message')}
  />
</div>
