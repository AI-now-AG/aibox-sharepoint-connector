<script>
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { onMount } from "svelte";
  import log from "$utils/log";
  import Loading from "$components/Loading.svelte";
  import { loading, showLoading, hideLoading } from "$stores/common";
  import { getLocale } from "$stores/locale";

  const t = useTranslations(getLocale());

  let tenants = [];
  let showArchived = false;

  const fetchTenants = async () => {
    showLoading();
    const { data, error } = await actions.tenant.list();
    hideLoading();
    if (!error) {
      tenants = data;
    } else {
      log.e(error, "Error fetching tenants");
    }
    log.d(data, "Tenant list");
  };

  onMount(async () => {
    await fetchTenants();
  });

  const gotoDetail = (tenant) => {
    window.location.href = `tenant-management/${tenant._id}`;
  };

  const copyName = (name) => {
    alert(name);
  };

  function showUpdateStatusConfirmationModal(tenant) {
    document.getElementById("my_modal_3" + tenant._id).showModal();
  }

  function closeUpdateStatusConfirmationModal(tenant) {
    document.getElementById("my_modal_3" + tenant._id).close();
  }

  const updateTenantStatus = async (tenant) => {
    const { active } = tenant;
    log.d(tenant, "updateTenantStatus");
    closeUpdateStatusConfirmationModal(tenant);
    showLoading();
    let result;
    if (active) {
      result = await actions.tenant.archive({
        _id: tenant._id,
      });
    } else {
      result = await actions.tenant.active({
        _id: tenant._id,
      });
    }
    hideLoading();
    const { data, error } = result;
    log.d(result, "updateTenantStatus --> result");
    if (!error) {
      await fetchTenants();
    } else {
      log.e(error, "Error updating tenant status");
    }
  };

  const onSearchTenant = (keyword) => {
    console.log(keyword);
  };
</script>

<Loading bind:show={$loading} />

<div class="container max-w-full mx-auto p-6" style="font-family: Inter;">
  <div class="items-center mb-10">
    <div class="relative w-full">
      <label class="input input-bordered flex items-center gap-2">
        {@html svgIcons.search}
        <input
          type="text"
          class="grow text-sm"
          placeholder={t("tenant.tenants.seach-place-holder")}
          on:change={(keyword) => onSearchTenant(keyword)}
        />
      </label>
    </div>
    <div class="mt-4">
      <label class="flex items-center space-x-2">
        <input
          type="checkbox"
          class="checkbox border-gray-300 rounded focus:ring-indigo-500 w-5 h-5"
          bind:checked={showArchived}
        />
        <span class="label-text">{t("tenant.tenants.show-archived")}</span>
      </label>
    </div>
  </div>

  <div>
    <h2 class="text-lg font-normal mb-4">
      {t("tenant.tenants.all-tenants", {amount: tenants.length})}
    </h2>

    <table class="min-w-full relative" style="font-family:Inter;">
      <thead>
        <tr class="bg-gray-200 rounded-lg">
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
        <tr class="header-spacing"></tr>
      </thead>
      <tbody>
        {#each tenants as tenant}
          <tr class="h-2"
            ><td /><td /><td /><td /><td>
              <dialog id={"my_modal_3" + tenant._id} class="modal">
                <div class="modal-box">
                  <form method="dialog" id="modalForm">
                    <button
                      class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                      >✕</button
                    >
                    <h3 id="modal_title" class="text-lg font-bold">
                      {tenant.active == 1
                        ? t("tenant.tenants.tenant.archive-confirmation")
                        : t("tenant.tenants.tenant.active-confirmation")}
                    </h3>
                    <div class="flex justify-between gap-4 mt-6">
                      <button
                        id="yes_button"
                        class="btn btn-warning flex-1"
                        on:click={() => updateTenantStatus(tenant)}
                        >{t("common.yes")}</button
                      >
                      <button
                        id="no_button"
                        class="btn btn-success flex-1"
                        on:click={() =>
                          closeUpdateStatusConfirmationModal(tenant)}
                        >{t("common.no")}</button
                      >
                    </div>
                  </form>
                </div>
              </dialog>
            </td></tr
          >

          <tr class="h-16 bg-white hover:bg-gray-200 text-sm rounded-lg">
            <td class="py-3 px-4 text-sm font-medium rounded-l-lg">
              <button
                class="underline underline-offset-2"
                on:click={() => gotoDetail(tenant)}>{tenant.name}</button
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
              <button class="focus:outline-none">
                {@html svgIcons["three-dot"]}
              </button>
              <div class="dropdown-content py-2">
                <button
                  class="flex block w-full text-left px-4 py-1 text-sm hover:underline"
                  on:click={() => showUpdateStatusConfirmationModal(tenant)}
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
                <button
                  class="flex block w-full text-left px-4 py-1 text-sm hover:underline"
                  on:click={() => gotoDetail(tenant)}
                >
                  {@html svgIcons.edit}
                  <span class="ml-1"
                    >{t("tenant.tenants.tenant.action.edit")}</span
                  >
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .dropdown-content {
    display: none;
    z-index: 1000;
    position: absolute;
    right: 10px;
    top: 40px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .relative-dropdown:hover .dropdown-content {
    display: block;
  }
</style>
