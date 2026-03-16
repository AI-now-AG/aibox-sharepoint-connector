<script lang="ts">
  import { onMount } from "svelte";
  import { svgIcons } from "$assets/icons";
  import { actions } from "astro:actions";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";
  import { getRoleString } from "$utils/roles";
  import { preventDefault, formatDate } from "$utils/common";
  import UserSearchFilter from "./UserSearchFilter.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import Loading from "$components/Loading.svelte";
  import Pagination from "$components/Pagination.svelte";

  const t = useTranslations();

  let loading: boolean = $state(false);
  let page: number = $state(1);
  let total: number = $state(0);
  let pageSize: number = $state(20);

  const from = $derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
  const to = $derived(Math.min(page * pageSize, total));

  let searchValue: string = $state("");
  let selectedTenant: string = $state("");
  let includeUnassigned: boolean = $state(false);
  let users: Record<string, any>[] = $state([]);

  let selectedUser: any = $state(null);
  let confirmDeleteModal: HTMLDialogElement | undefined = $state();

  onMount(() => {
    fetchUserListReport();
  });

  const handlePageChange = (p: number) => {
    page = p;
    fetchUserListReport();
  };

  const fetchUserListReport = async () => {
    loading = true;

    users = [];

    const { data, error } = await actions.report.userListReport({
      page,
      pageSize,
      search: searchValue,
      tenant: selectedTenant,
      includeUnassigned,
    });
    loading = false;

    if (error) {
      console.error(error);
      addToast({
        message: "Something went wrong",
        type: "error",
      });
      return;
    }

    users = data.data;
    total = data.total;
  };

  function onSelectDelete(tenantId: any) {
    selectedUser = tenantId;
    confirmDeleteModal?.showModal();
  }

  async function deleteTenant() {
    let result = await actions.user.delete({
      _id: selectedUser,
    });
    loading = false;
    const { error } = result;
    if (error) {
      addToast({
        message: t("user.delete-failed"),
        type: "error",
      });
      return;
    }

    addToast({
      message: t("user.delete-successful"),
      type: "success",
    });
    await fetchUserListReport();
  }

  const exportUserList = async () => {
    loading = true;
    fetch("/api/users/export", {
      method: "POST",
    })
      .then(async (response) => {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(
          new Blob([blob], { type: "text/csv;charset=utf-8" }),
        );

        const disposition = response.headers.get("Content-Disposition");
        const parts = disposition?.split(";") || "";
        const fileName = parts[1].replace(/['"]/g, "").split("=")[1];

        console.log("fileName", { disposition, parts, fileName });

        const link = document.createElement("a");
        link.href = blobUrl;
        link.target = "_blank";
        link.download = fileName;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

        loading = false;
      })
      .catch((error) => {
        console.error("Error downloading file:", error);
        loading = false;
      });
  };
</script>

<div class="grid grid-cols-1 md:grid-cols-[1fr_max-content] mt-3 mb-4">
  <h1 class="text-4xl font-bold">
    {t("nav.user-list-report")}
  </h1>

  <div class="flex gap-2">
    <button
      class="btn btn-outline font-normal grow-0"
      onclick={preventDefault(exportUserList)}
    >
      {@html svgIcons.fileExport}
      {t("user-list-report.export")}
    </button>
  </div>
</div>

<div class="mb-5">
  <UserSearchFilter
    bind:value={searchValue}
    bind:selectedTenant
    bind:includeUnassigned
    onsearch={() => {
      page = 1;
      fetchUserListReport();
    }}
    onfilter={() => {
      page = 1;
      fetchUserListReport();
    }}
  />

  {#if users.length === 0}
    {#if !loading}
      <div class="text-center text-gray-500 py-6">No users found.</div>
    {/if}
  {:else}
    <div class="mb-4">
      <div class="overflow-x-auto relative">
        <table
          class="table table-fixed border-separate border-spacing-x-0 min-w-full relative"
        >
          <colgroup>
            <col class="w-auto min-w-[180]" />
            <col class="w-[250]" />
            <col class="w-[120]" />
            <col class="w-[150]" />
            <col class="w-[150]" />
            <col class="w-[100]" />
          </colgroup>
          <thead>
            <tr class="bg-base-300">
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("user.e-mail")}</th
              >
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("user.tenant")}</th
              >
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("user.roles")}</th
              >
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("user.latest-login")}</th
              >
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("user.status")}</th
              >
              <th class="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {#each users as user}
              <tr class="bg-base-100 text-sm">
                <td class="py-3 px-4 text-sm font-medium"
                  ><span class="break-all">{user.email}</span></td
                >
                <td class="py-3 px-4 text-sm font-medium"
                  >{user.tenant?.name || "Unknow"}</td
                >
                <td class="py-3 px-4 text-sm font-medium"
                  >{getRoleString(user.roles)}</td
                >
                <td class="py-3 px-4 text-sm font-medium"
                  >{user.last_login ? formatDate(user.last_login) : "-"}</td
                >
                <td class="py-3 px-4 text-sm font-medium text-center">
                  {#if user.blocked}
                    <span style={`color: #FF6F70`}>{t("user.blocked")}</span>
                  {:else if !user.email_verified}
                    <span style={`color: rgba(43, 52, 64, 0.2)`}
                      >{t("user.un-veriried")}</span
                    >
                  {:else}
                    <span style={`color: 00CA92`}>{t("user.veriried")}</span>
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
                          class="flex block w-full text-left px-4 py-1 text-sm hover:underline"
                          onclick={() => onSelectDelete(user._id)}
                        >
                          {@html svgIcons.trash}
                          <span class="ml-1">{t("common.delete")}</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
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
  {/if}
</div>

<Loading show={loading} />

<ConfirmDialog
  bind:modal={confirmDeleteModal}
  confirm={deleteTenant}
  description={t("user.delete-confirm-message")}
/>
