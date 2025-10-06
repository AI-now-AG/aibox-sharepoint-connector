<script lang="ts">
  import dayjs from "dayjs";
  import { actions } from "astro:actions";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";
  import { preventDefault } from "$utils/common";
  import { svgIcons } from "$assets/icons";
  import Dropdown, { type Option } from "$components/form/Dropdown.svelte";
  import type { CreditUsage } from "$types/UsageTracking";
  import Loading from "$components/Loading.svelte";
  import { tenant as tenantStore } from "$stores";

  const t = useTranslations();

  let loading: boolean = $state(false);
  let creditUsageData: CreditUsage[] = $state([]);
  let selectedMonth: string = $state("");

  const getMonthOptions = (): Option[] => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = dayjs().subtract(i, "month");
      return {
        value: date.format("MM-YYYY"), // e.g., "10-2025"
        title: date.format("MMMM YYYY"), // e.g., "October 2025"
      };
    });
  };

  const fetchCreditUsages = async () => {
    loading = true;

    creditUsageData = [];

    const { data, error } = await actions.report.creditUsageAll({
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
      creditUsageData = data.data;
    }
  };

  const monthOptions = getMonthOptions();
</script>

<div class="mt-5">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-end mb-10">
    <div class="form-control">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="label">
        <span class="label-text">{t("usage.select-month")}:</span>
      </label>
      <Dropdown
        classes="flex-1"
        options={monthOptions}
        bind:value={selectedMonth}
      />
    </div>
    <div class="form-control">
      <button
        class="btn btn-primary"
        onclick={preventDefault(fetchCreditUsages)}
        disabled={!selectedMonth || loading}>{@html svgIcons.search}</button
      >
    </div>
  </div>

  {#if creditUsageData.length === 0}
    {#if !loading}
      <div class="text-center text-gray-500 py-6">
        {t("usage.no-data-available")}
      </div>
    {/if}
  {:else}
    <div class="mb-4">
      <table class="table border min-w-full relative">
        <colgroup>
          <col class="w-auto" />
          <col class="w-[250]" />
          <col class="w-[150]" />
          <col class="w-[150]" />
        </colgroup>
        <thead>
          <tr class="bg-base-300">
            <th class="py-3 px-4 text-left font-semibold text-sm"
              >{t("credit-usage.tenant-name")}</th
            >
            <th class="py-3 px-4 text-left font-semibold text-sm"
              >{t("credit-usage.subscription")}</th
            >
            <th class="py-3 px-4 text-center font-semibold text-sm"
              >{t("credit-usage.credits-used")}</th
            >
            <th class="py-3 px-4 text-center font-semibold text-sm"
              >{t("credit-usage.active-users")}</th
            >
          </tr>
        </thead>
        <tbody>
          {#each creditUsageData as item}
            <tr class="bg-base-100 text-sm">
              <td class="py-3 px-4 text-sm font-medium">{item.tenantName}</td>
              <td class="py-3 px-4 text-sm font-medium">{item.planName}</td>
              <td class="py-3 px-4 text-sm font-medium text-center"
                >{item.creditsUsed}</td
              >
              <td class="py-3 px-4 text-sm font-medium text-center"
                >{item.activeUsers}</td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<Loading show={loading} />
