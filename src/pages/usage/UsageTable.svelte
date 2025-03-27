<script lang="ts">
  import { actions } from "astro:actions";
  import { onMount } from "svelte";
  import { addToast } from "$stores/toast";

  interface UsageRow {
    tenant: string;
    type: string;
    provider: string;
    model: string;
    total_input: number;
    total_output: number;
    cost: number;
  }

  let loading: boolean = $state(false);
  let usageData: UsageRow[] = $state([]);

  onMount(async () => {
    fetchUsages();
  });

  const fetchUsages = async () => {
    loading = true;
    const { data, error } = await actions.usage.usageSummary();
    loading = false;

    if (error) {
      addToast({
        message: "Something went wrong",
        type: "error",
      });
    } else {
      usageData = data;
    }
  };
</script>

<div class="container max-w-full mx-auto p-6 overflow-x-auto mt-4">
  {#if loading}
    <div class="flex justify-center items-center gap-2 text-primary">
      <span class="loading loading-spinner"></span>
      <span>Loading usage data...</span>
    </div>
  {:else if usageData.length === 0}
    <div class="text-center text-gray-500 py-6">No usage data available.</div>
  {:else}
    <table
      class="border-separate border-spacing-x-0 border-spacing-y-3 min-w-full relative"
    >
      <thead>
        <tr class="bg-base-300 rounded-lg">
          <th class="py-3 px-4 text-left font-normal text-xs">Tenant</th>
          <th class="py-3 px-4 text-left font-normal text-xs">Provider</th>
          <th class="py-3 px-4 text-left font-normal text-xs">Model</th>
          <th class="py-3 px-4 text-left font-normal text-xs">Type</th>
          <th class="py-3 px-4 text-left font-normal text-xs">Input Tokens</th>
          <th class="py-3 px-4 text-left font-normal text-xs">Output Tokens</th>
          <th class="py-3 px-4 text-left font-normal text-xs">Total Cost ($)</th
          >
        </tr>
      </thead>
      <tbody>
        {#each usageData as row}
          <tr class="h-16 bg-base-100 hover:bg-base-300 text-sm rounded-lg">
            <td class="py-3 px-4 text-sm font-medium rounded-l-lg"
              >{row.tenant}</td
            >
            <td class="py-3 px-4 text-sm font-medium rounded-l-lg"
              >{row.provider}</td
            >
            <td class="py-3 px-4 text-sm font-medium rounded-l-lg"
              >{row.model}</td
            >
            <td class="py-3 px-4 text-sm font-medium rounded-l-lg"
              >{row.type}</td
            >
            <td class="py-3 px-4 text-sm font-medium rounded-l-lg"
              >{row.total_input}</td
            >
            <td class="py-3 px-4 text-sm font-medium rounded-l-lg"
              >{row.total_output}</td
            >
            <td class="py-3 px-4 text-sm font-medium rounded-l-lg"
              >{row.cost.toFixed(4)}</td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
