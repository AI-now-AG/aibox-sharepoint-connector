<script lang="ts">
  import { onMount } from "svelte";
  import { svgIcons } from "$assets/icons";
  import { actions } from "astro:actions";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";
  import { getRoleString } from "$utils/roles";
  import { debounce, preventDefault, formatDateToDDMMYY } from "$utils/common";
  import Loading from "$components/Loading.svelte";
  import Pagination from "$components/Pagination.svelte";

  const t = useTranslations();

  let loading: boolean = $state(false);
  let page: number = $state(1);
  let total = $state(0);
  let search: string = $state("");
  let users: Record<string, any>[] = $state([]);

  const PAGE_SIZE = 20;

  onMount(() => {
    fetchUserListReport();
  });

  const debouncedSearch = debounce((value: string) => {
    page = 1;
    search = value;
    fetchUserListReport();
  }, 300);

  const handlePageChange = (p: number) => {
    page = p;
    fetchUserListReport();
  };

  const fetchUserListReport = async () => {
    loading = true;

    users = [];

    const { data, error } = await actions.report.userListReport({
      page,
      pageSize: PAGE_SIZE,
      search,
    });
    loading = false;

    if (error) {
      console.error(error);
      addToast({
        message: "Something went wrong",
        type: "error",
      });
    } else {
      users = data.data;
      total = data.total;
    }
  };

  const exportUserList = async () => {
    loading = true;
    fetch("/api/users/export")
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
  <div class="items-center mb-4">
    <div class="relative w-full">
      <label class="input input-bordered flex items-center gap-2 w-full">
        {@html svgIcons.search}
        <input
          type="text"
          class="grow text-sm"
          placeholder={t("user.search-for-users")}
          bind:value={search}
          oninput={(e) => debouncedSearch((e.target as HTMLInputElement).value)}
        />
      </label>
    </div>
  </div>

  {#if users.length === 0}
    {#if !loading}
      <div class="text-center text-gray-500 py-6">No users found.</div>
    {/if}
  {:else}
    <div class="mb-4">
      <table class="table border min-w-full relative">
        <colgroup>
          <col class="w-auto" />
          <col class="w-[250]" />
          <col class="w-[120]" />
          <col class="w-[150]" />
          <col class="w-[150]" />
        </colgroup>
        <thead>
          <tr class="bg-base-300">
            <th class="py-3 px-4 text-left font-semibold text-sm"
              >{t("user.e-mail")}</th
            >
            <th class="py-3 px-4 font-semibold text-sm">{t("user.tenant")}</th>
            <th class="py-3 px-4 font-semibold text-sm">{t("user.roles")}</th>
            <th class="py-3 px-4 font-semibold text-sm"
              >{t("user.latest-login")}</th
            >
            <th class="py-3 px-4 text-center font-semibold text-sm"
              >{t("user.status")}</th
            >
          </tr>
        </thead>
        <tbody>
          {#each users as user}
            <tr class="bg-base-100 text-sm">
              <td class="py-3 px-4 text-sm font-medium">{user.email}</td>
              <td class="py-3 px-4 text-sm font-medium">{user.tenant?.name}</td>
              <td class="py-3 px-4 text-sm font-medium"
                >{getRoleString(user.roles)}</td
              >
              <td class="py-3 px-4 text-sm font-medium"
                >{user.last_login
                  ? formatDateToDDMMYY(user.last_login)
                  : "-"}</td
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
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <Pagination
      bind:page
      pageSize={PAGE_SIZE}
      {total}
      onPageChange={handlePageChange}
    />
  {/if}
</div>

<Loading show={loading} />
