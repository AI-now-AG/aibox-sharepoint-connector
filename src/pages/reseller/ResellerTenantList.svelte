<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import { useTranslations } from "$i18n/utils";
  import { formatDate } from "$utils/common";
  import { getSubscriptionAddOnName } from "$utils/subscription";
  import Loading from "$components/Loading.svelte";
  import ResellerTenantSearch from "./ResellerTenantSearch.svelte";
  import Pagination from "$components/Pagination.svelte";

  interface Props {
    resellerCode: string;
  }

  let { resellerCode = "" }: Props = $props();

  const t = useTranslations();
  let loading = $state(false);

  let tenants: any = $state([]);
  let page: number = $state(1);
  let total: number = $state(0);
  let pageSize: number = $state(10);

  const from = $derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
  const to = $derived(Math.min(page * pageSize, total));

  let searchValue: string = $state("");

  onMount(async () => {
    await fetchTenants();
  });

  const fetchTenants = async () => {
    loading = true;
    const { data, error } = await actions.tenant.list({
      page,
      pageSize,
      searchValue,
      statusFlags: [],
      resellerCode,
    });

    loading = false;

    if (!error) {
      tenants = data.data;
      total = data.total;
    } else {
      console.log("Error fetching tenants", error);
    }
  };

  const handlePageChange = (p: number) => {
    page = p;
    fetchTenants();
  };
</script>

<div
  class="container max-w-full mx-auto grid grid-cols-1 md:grid-cols-[1fr_max-content] px-14"
>
  <h1 class="pt-2 lg:pt-8 text-4xl font-bold">
    {t("reseller.dashboard.managed-tenant-title")}
  </h1>
</div>

<div class="px-8">
  <div class="max-w-full mx-auto p-6">
    <ResellerTenantSearch
      bind:value={searchValue}
      onsearch={() => {
        page = 1;
        fetchTenants();
      }}
    />

    <div>
      <div class="overflow-x-auto relative">
        <table
          class="table table-fixed border-separate border-spacing-x-0 min-w-full relative"
        >
          <colgroup>
            <col class="w-auto min-w-[180]" />
            <col class="w-[250]" />
            <col class="w-[150]" />
            <col class="w-[150]" />
            <col class="w-[150]" />
          </colgroup>
          <thead>
            <tr class="bg-base-300">
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("reseller.dashboard.tenant-name")}</th
              >
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("reseller.dashboard.tenant-subscription")}</th
              >
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("reseller.dashboard.tenant-subscription-start")}</th
              >
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("reseller.dashboard.tenant-cancellation-date")}</th
              >
              <th class="py-3 px-4 text-left font-normal text-xs"
                >{t("reseller.dashboard.tenant-status")}</th
              >
            </tr>
          </thead>
          <tbody>
            {#each tenants as tenant}
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
                  {tenant.name}
                </td>

                <td class="py-2 px-4">
                  <span class="block text text-sm font-medium">
                    {tenant.subscription?.plan_name}
                  </span>
                  <span class="flex flex-col gap-1 pt-1">
                    {#if audioAddOn}
                      <span class="badge badge-ghost badge-sm">
                        {audioAddOn}
                      </span>
                    {/if}
                    {#if subtitleAddOn}
                      <span class="badge badge-ghost badge-sm">
                        {subtitleAddOn}
                      </span>
                    {/if}
                  </span>
                </td>

                <td class="py-2 px-4">
                  {tenant.subscription?.start_date
                    ? formatDate(tenant.subscription.start_date)
                    : "-"}
                </td>

                <td class="py-2 px-4">
                  {tenant.subscription?.cancelled_date
                    ? formatDate(tenant.subscription.cancelled_date)
                    : "-"}
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
  </div>
</div>
