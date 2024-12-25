<script>
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { onMount } from "svelte";
  import log from "$utils/log";
  import { addToast } from "$stores/toast";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import Loading from "$components/Loading.svelte";
  import { loading, showLoading, hideLoading } from "$stores";

  const t = useTranslations();

  let tenants = [];
  let showArchived = false;
  let searchValue = "";
  let timeout;

  let tenantToUpdate = null;
  let confirmDescription = '';
  let confirmUpdateModal;

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

  const copyName = (name) => {
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

  function confirmUpdateStatus(tenant) {
    tenantToUpdate = tenant;
    confirmDescription = tenant.active == 1 
      ? t("tenant.tenants.tenant.archive-confirmation")
      : t("tenant.tenants.tenant.active-confirmation");

    confirmUpdateModal?.show();
  }

  const updateTenantStatus = async () => {
    const { active } = tenantToUpdate;
    log.d(tenantToUpdate, "updateTenantStatus");
    confirmUpdateModal?.close();

    showLoading();
    let result;
    if (active) {
      result = await actions.tenant.archive({
        _id: tenantToUpdate._id,
      });
    } else {
      result = await actions.tenant.active({
        _id: tenantToUpdate._id,
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

  const onSearchTenant = ({ target: t }) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      searchValue = t.value;
      fetchTenants();
    }, 300);
  };

  const onShowArchived = (event) => {
    showArchived = !showArchived;
    setTimeout(() => (event.target.checked = showArchived), 0);
    fetchTenants();
  };
</script>

<div class="container max-w-full mx-auto p-6">
  <div class="items-center mb-10">
    <div class="relative w-full">
      <label class="input input-bordered flex items-center gap-2">
        {@html svgIcons.search}
        <input
          type="text"
          class="grow text-sm"
          placeholder={t("tenant.tenants.seach-place-holder")}
          on:input={onSearchTenant}
          on:input
          on:blur
        />
      </label>
    </div>
    <div class="mt-4">
      <label class="flex items-center space-x-2">
        <input
          type="checkbox"
          class="checkbox border-gray-300 rounded focus:ring-indigo-500 w-5 h-5"
          checked={showArchived}
          on:click|preventDefault={onShowArchived}
        />
        <span class="label-text">{t("tenant.tenants.show-archived")}</span>
      </label>
    </div>
  </div>

  <div>
    <h2 class="text-lg font-normal mb-4">
      {t("tenant.tenants.all-tenants", { amount: tenants.length })}
    </h2>

    <div class="relative">
      <table class="border-separate	border-spacing-x-0 border-spacing-y-3 min-w-full relative" style="font-family:Inter;">
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
                  <ul class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                    <li>
                      <button
                        class="flex block w-full text-left px-4 py-2 text-sm hover:underline"
                        on:click={() =>
                          confirmUpdateStatus(tenant)}
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
    on:confirm={updateTenantStatus}
    description={confirmDescription}
  />
</div>
