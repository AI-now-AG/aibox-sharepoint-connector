<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { preventDefault } from "$utils/common";
  import { svgIcons } from "$assets/icons";
  import SelectOptions, { type Option } from "$components/SelectOptions.svelte";

  const t = useTranslations();

  interface Props {
    tenants: any;
    selectedTenant: string;
    selectedMonth?: string;
    onsearch: Function;
  }

  let {
    tenants,
    selectedTenant = $bindable(),
    selectedMonth = $bindable(),
    onsearch,
  }: Props = $props();

  const tenantOptions: Option[] = tenants.map((item: any) => {
    return {
      value: item._id,
      label: item.name,
    };
  });

  // Generate an array of the current month and the previous 6 months
  function getMonthOptions(): Option[] {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Format as mm
      const year = date.getFullYear(); // Get the full year
      const monthName = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      const formattedMonth = `${month}-${year}`; // Format as mm-yyyy
      months.push({
        value: formattedMonth,
        label: monthName,
      });
    }
    return months;
  }

  const monthOptions = getMonthOptions();
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-end mb-10">
  <div class="form-control">
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label class="label">
      <span class="label-text">{t("usage.select-tenant")}:</span>
    </label>
    <SelectOptions
      classes="flex-1"
      options={tenantOptions}
      bind:value={selectedTenant}
    />
  </div>
  <div class="form-control">
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label class="label">
      <span class="label-text">{t("usage.select-month")}:</span>
    </label>
    <SelectOptions
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
