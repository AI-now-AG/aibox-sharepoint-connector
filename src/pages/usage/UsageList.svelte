<script lang="ts">
  import { actions } from "astro:actions";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";
  import type { UsageOverview, UsageRow } from "$types/UsageTracking";
  import Loading from "$components/Loading.svelte";
  import UsageFilter from "./UsageFilter.svelte";

  const t = useTranslations();

  interface Props {
    tenants?: any;
  }

  let { tenants = [] }: Props = $props();

  let loading: boolean = $state(false);
  let usageInfo: UsageOverview | undefined = $state();
  let usageData: UsageRow[] = $state([]);
  let selectedTenant: string = $state("");
  let selectedMonth: string = $state("");

  const fetchUsages = async () => {
    loading = true;

    usageInfo = undefined;
    usageData = [];

    const { data, error } = await actions.usage.usageSummary({
      tenant_id: selectedTenant,
      month: selectedMonth,
    });
    loading = false;

    if (error) {
      console.error(error);
      addToast({
        message: "Something went wrong",
        type: "error",
      });
    } else {
      usageInfo = data.overview;
      usageData = data.data;
    }
  };

  const formatNumber = (input: any) => {
    let number = Number(input);
    if (isNaN(number)) number = 0;

    return number.toLocaleString("de-CH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  $inspect(selectedTenant);
  $inspect(selectedMonth);
</script>

<div class="mt-5">
  <UsageFilter
    {tenants}
    bind:selectedTenant
    bind:selectedMonth
    onsearch={fetchUsages}
  />

  {#if usageData.length === 0}
    {#if !loading}
      <div class="text-center text-gray-500 py-6">
        {t("usage.no-data-available")}
      </div>
    {/if}
  {:else}
    {#if usageInfo}
      <div class="mb-8">
        <table class="table table-xs border w-auto">
          <colgroup>
            <col class="w-[150]" />
            <col class="w-auto" />
          </colgroup>
          <tbody>
            <tr class="bg-base-100 text-sm">
              <td class="bg-base-300 text-sm font-medium"
                ><strong>{t("usage.summary.tenant")}</strong></td
              >
              <td class="text-sm font-medium">{usageInfo.tenant}</td>
            </tr>
            <tr class="bg-base-100 text-sm">
              <td class="bg-base-300 text-sm font-medium"
                ><strong>{t("usage.summary.month")}</strong></td
              >
              <td class="text-sm font-medium">{usageInfo.month}</td>
            </tr>
            <tr class="bg-base-100 text-sm">
              <td class="bg-base-300 text-sm font-medium"
                ><strong>{t("usage.summary.credits-used")}</strong></td
              >
              <td class="text-sm font-medium"
                >{formatNumber(usageInfo.creditsUsed)}</td
              >
            </tr>
          </tbody>
        </table>
      </div>
    {/if}
    {#each usageData as row}
      <div class="mb-4">
        <table class="table border min-w-full relative">
          <colgroup>
            <col class="w-auto" />
            <col class="w-[150]" />
            <col class="w-[100]" />
            <col class="w-[120]" />
            <col class="w-[100]" />
          </colgroup>
          <thead>
            <tr class="bg-base-300">
              <th
                class="py-3 px-4 text-left font-semibold text-sm text-base-content"
                >{row.provider}</th
              >
              <th class="py-3 px-4 text-left font-semibold text-sm">&nbsp;</th>
              <th class="py-3 px-4 text-left font-semibold text-sm">&nbsp;</th>
              <th class="py-3 px-4 text-left font-semibold text-sm">&nbsp;</th>
              <th class="py-3 px-4 text-left font-semibold text-sm">&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {#each row.details as item}
              <tr class="bg-base-100 text-sm">
                <td class="py-3 px-4 text-sm font-medium">{item.model}</td>
                <td class="py-3 px-4 text-sm font-medium"
                  >{formatNumber(item.amount)}</td
                >
                <td class="py-3 px-4 text-sm font-medium">{item.unit}</td>
                <td class="py-3 px-4 text-sm font-medium"
                  >{!item.private ? formatNumber(item.credits) : "private key"}
                </td>
                <td class="py-3 px-4 text-sm font-medium"
                  >{!item.private ? t("usage.units.credits") : "-"}</td
                >
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/each}
  {/if}
</div>

<Loading show={loading} />
