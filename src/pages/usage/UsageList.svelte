<script lang="ts">
  import { actions } from "astro:actions";
  import { addToast } from "$stores/toast";
  import type { UsageOverview, UsageRow } from "$types/UsageTracking";
  import UsageFilter from "./UsageFilter.svelte";

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

  $inspect(selectedTenant);
  $inspect(selectedMonth);
</script>

<div class="container max-w-full mx-auto p-6 overflow-x-auto mt-4">
  <UsageFilter
    {tenants}
    bind:selectedTenant
    bind:selectedMonth
    onsearch={fetchUsages}
  />

  {#if loading}
    <div class="flex justify-center items-center gap-2 text-primary">
      <span class="loading loading-spinner"></span>
      <span>Loading usage data...</span>
    </div>
  {:else if usageData.length === 0}
    <div class="text-center text-gray-500 py-6">No usage data available.</div>
  {:else}
    {#if usageInfo}
      <div class="mb-4">
        <ul>
          <li><strong>Tenant</strong> {usageInfo.tenant}</li>
          <li><strong>Month</strong> {usageInfo.month}</li>
          <li><strong>Credits used</strong> {usageInfo.creditsUsed}</li>
        </ul>
      </div>
    {/if}
    {#each usageData as row}
      <div class="mb-3">
        <table class="table border min-w-full relative">
          <thead>
            <tr class="bg-base-300 rounded-lg">
              <th class="py-3 px-4 text-left font-medium text-sm"
                >{row.provider}</th
              >
              <th class="py-3 px-4 text-left font-medium text-sm">&nbsp;</th>
              <th class="py-3 px-4 text-left font-medium text-sm">&nbsp;</th>
              <th class="py-3 px-4 text-left font-medium text-sm">&nbsp;</th>
              <th class="py-3 px-4 text-left font-medium text-sm">&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {#each row.details as item}
              <tr class="bg-base-100 text-sm">
                <td class="py-3 px-4 text-sm font-medium">{item.model}</td>
                <td class="py-3 px-4 text-sm font-medium">{item.amount}</td>
                <td class="py-3 px-4 text-sm font-medium">{item.unit}</td>
                <td class="py-3 px-4 text-sm font-medium">{item.credits}</td>
                <td class="py-3 px-4 text-sm font-medium">credits</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/each}
  {/if}
</div>
