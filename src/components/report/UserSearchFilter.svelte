<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { preventDefault, debounce } from "$utils/common";
  import TenantSearch from "$components/tenant/TenantSearch.svelte";

  const t = useTranslations();

  interface Props {
    value?: string;
    selectedTenant?: string;
    includeUnassigned?: boolean;
    onsearch: Function;
    onfilter: Function;
  }

  let {
    value = $bindable(""),
    selectedTenant = $bindable(""),
    includeUnassigned = $bindable(false),
    onsearch,
    onfilter,
  }: Props = $props();

  const onSearch = debounce(({ target }: any) => {
    value = (target as HTMLInputElement).value;
    onsearch?.();
  }, 300);
</script>

<div class="px-5 py-5 bg-base-100 rounded-lg items-center mb-10">
  <div class="inline-flex items-center mb-2">
    {@html svgIcons.filter}
    <h3 class="ml-2 text-normal font-normal">
      {t("user-list-report.filter.filter-label")}
    </h3>
  </div>

  <div class="grid grid-cols-1 xl:grid-cols-12 gap-10">
    <div class="col-span-3 xl:col-span-4">
      <p class="mb-1 text-base-content/80">
        {t("user-list-report.filter.seach-label")}
      </p>
      <label
        class="input input-bordered flex items-center gap-2 w-full max-w-sm
"
      >
        {@html svgIcons.search}
        <input
          type="text"
          class="grow"
          placeholder={t("user-list-report.filter.seach-placeholder")}
          oninput={preventDefault(onSearch)}
        />
      </label>
    </div>
    <div class="col-span-6 xl:col-span-5">
      <p class="mb-2 text-base-content/80">
        {t("user-list-report.filter.tenant-label")}
      </p>
      <TenantSearch
        bind:selectedTenant
        placeholder={t("user-list-report.filter.tenant-placeholder")}
        onselect={() => {
          onfilter?.();
        }}
        onclear={() => {
          onfilter?.();
        }}
      />
    </div>
    <div class="col-span-3 xl:col-span-3">
      <p class="mb-2 text-base-content/80">
        {t("user-list-report.filter.others-label")}
      </p>
      <label class="flex items-center space-x-2">
        <input
          type="checkbox"
          name="unscoped_user"
          class="checkbox checkbox-sm checkbox-neutral"
          checked={includeUnassigned}
          onclick={() => {
            includeUnassigned = !includeUnassigned;
            onfilter?.();
          }}
        />
        <span class="text-sm font-normal"
          >{t("user-list-report.filter.include-unassigned-users")}</span
        >
      </label>
    </div>
  </div>
</div>
