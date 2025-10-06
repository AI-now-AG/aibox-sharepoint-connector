<script lang="ts">
  import dayjs from "dayjs";
  import { useTranslations } from "$i18n/utils";
  import { preventDefault } from "$utils/common";
  import { svgIcons } from "$assets/icons";
  import Dropdown, { type Option } from "$components/form/Dropdown.svelte";

  const t = useTranslations();

  interface Props {
    tenants: any;
    selectedTenant: string;
    selectedMonth?: string;
    onsearch: Function;
  }

  let {
    tenants = [],
    selectedTenant = $bindable(null),
    selectedMonth = $bindable(null),
    onsearch,
  }: Props = $props();

  const tenantOptions: Option[] = tenants.map((item: any) => {
    return {
      value: item._id,
      title: item.name,
    };
  });

  // Generate an array of the current month and the previous 6 months
  const getMonthOptions = (): Option[] => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = dayjs().subtract(i, "month");
      return {
        value: date.format("MM-YYYY"), // e.g., "10-2025"
        title: date.format("MMMM YYYY"), // e.g., "October 2025"
      };
    });
  };

  const monthOptions = getMonthOptions();
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-end mb-10">
  {#if tenantOptions.length}
    <div class="form-control">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="label">
        <span class="label-text">{t("usage.select-tenant")}:</span>
      </label>
      <Dropdown
        classes="flex-1"
        options={tenantOptions}
        bind:value={selectedTenant}
      />
    </div>
  {/if}
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
      onclick={preventDefault(onsearch)}
      disabled={!selectedTenant || !selectedMonth}
      >{@html svgIcons.search}</button
    >
  </div>
</div>
