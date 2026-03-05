<script lang="ts">
  import { actions } from "astro:actions";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";
  import type { UsageOverview, UsageRow } from "$types/UsageTracking";
  import Loading from "$components/Loading.svelte";
  import TenantUsageFilter from "./TenantUsageFilter.svelte";
  import { tenant, tenant as tenantStore } from "$stores";
  import { EventName, ScreenName } from "$types/Posthog";
  import { posthogClientCapture } from "$utils/posthogClient";
  import { svgIcons } from "$assets/icons";

  const t = useTranslations();

  interface Props {
    tenants?: any;
    isPosthogCaptureUsageRequest?: boolean;
  }

  let { tenants = [], isPosthogCaptureUsageRequest = false }: Props = $props();

  let loading: boolean = $state(false);
  let usageInfo: UsageOverview | undefined = $state();
  let usageData: UsageRow[] = $state([]);
  let selectedTenant: string = $state("");
  let selectedMonth: string = $state("");
  let expandedProviders: Record<string, boolean> = $state({});

  if (tenants.length == 0) {
    selectedTenant = $tenantStore?._id?.toString() ?? "";
  }

  const fetchUsages = async () => {
    loading = true;

    usageInfo = undefined;
    usageData = [];

    const { data, error } = await actions.report.usagePerTenant({
      tenant_id: selectedTenant,
      month: selectedMonth,
    });
    loading = false;

    if (isPosthogCaptureUsageRequest) {
      posthogClientCapture($tenant, EventName.AiboxUsageRequested, {
        page_name: ScreenName.BillingUsage,
        use_case: selectedMonth || "-",
      });
    }

    if (error) {
      console.error(error);
      addToast({
        message: error.message || "Something went wrong",
        type: "error",
      });
    } else {
      usageInfo = data.overview;
      usageData = data.data;
      expandedProviders = data.data.reduce(
        (acc: Record<string, boolean>, row: UsageRow) => {
          acc[row.provider] = false;
          return acc;
        },
        {},
      );
    }
  };

  const formatNumber = (input: any) => {
    let number = Number(input);
    if (isNaN(number)) number = 0;

    return number.toLocaleString("de-CH", {
      maximumFractionDigits: 2,
    });
  };

  const toggleProvider = (provider: string) => {
    expandedProviders = {
      ...expandedProviders,
      [provider]: !expandedProviders[provider],
    };
  };

  const getProviderCredits = (details: UsageRow["details"]) => {
    return details.reduce((total, item) => total + item.credits, 0);
  };
</script>

<div class="mt-5">
  <TenantUsageFilter
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
        <div
          class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-base-100 border rounded-xl shadow-sm p-4"
        >
          <div>
            <p class="text-xs uppercase text-gray-500">
              {t("usage.summary.tenant")}
            </p>
            <p class="text-base font-semibold mt-1">{usageInfo.tenant}</p>
          </div>
          <div>
            <p class="text-xs uppercase text-gray-500">
              {t("usage.summary.month")}
            </p>
            <p class="text-base font-semibold mt-1">{usageInfo.month}</p>
          </div>
          <div>
            <p class="text-xs uppercase text-gray-500">
              {t("usage.summary.credits-used")}
            </p>
            <p class="text-base font-semibold mt-1">
              {formatNumber(usageInfo.creditsUsed)}
            </p>
          </div>
        </div>
      </div>
    {/if}
    {#each usageData as row}
      <div class="mb-4 border rounded-lg overflow-hidden">
        <button
          type="button"
          class="flex w-full items-center justify-between bg-base-300 px-4 py-3 text-left"
          onclick={() => toggleProvider(row.provider)}
        >
          <span class="text-sm font-semibold text-base-content"
            >{row.provider}</span
          >
          <div class="flex items-center gap-4">
            <span class="text-sm font-semibold text-base-content"
              >{t("usage.table.credits-total")}: {formatNumber(
                getProviderCredits(row.details),
              )}</span
            >
            <span
              class={`text-lg transition-transform ${
                expandedProviders[row.provider] ? "rotate-180" : ""
              }`}>{@html svgIcons.arrowDownFill}</span
            >
          </div>
        </button>

        {#if expandedProviders[row.provider]}
          <table class="table table-sm border-t min-w-full relative">
            <colgroup>
              <col class="w-auto" />
              <col class="w-[160]" />
              <col class="w-[140]" />
              <col class="w-[140]" />
            </colgroup>
            <thead>
              <tr class="bg-base-200 text-xs uppercase tracking-wide">
                <th class="py-2 px-4 text-left font-semibold">
                  {t("usage.table.use-case")}
                </th>
                <th class="py-2 px-4 text-right font-semibold">
                  {t("usage.table.amount")}
                </th>
                <th class="py-2 px-4 text-left font-semibold">
                  {t("usage.table.unit")}
                </th>
                <th class="py-2 px-4 text-right font-semibold">
                  {t("usage.table.credits")}
                </th>
              </tr>
            </thead>
            <tbody>
              {#each row.details as item}
                <tr class="bg-base-100 text-sm">
                  <td class="py-3 px-4 text-sm font-medium">{item.model}</td>
                  <td class="py-3 px-4 text-sm font-medium text-right">
                    {formatNumber(item.amount)}
                  </td>
                  <td class="py-3 px-4 text-sm font-medium">{item.unit}</td>
                  <td class="py-3 px-4 text-sm font-semibold text-right">
                    {#if !item.private}
                      <div class="flex items-center justify-end gap-2">
                        <span>{formatNumber(item.credits)}</span>
                        <span class="text-xs text-gray-500"
                          >{t("usage.units.credits")}</span
                        >
                      </div>
                    {:else}
                      <span class="text-xs text-gray-500">private key</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<Loading show={loading} />
