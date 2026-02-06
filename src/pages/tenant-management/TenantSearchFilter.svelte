<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { preventDefault } from "$utils/common";
  import { FlagStatus } from "$types/TenantMgnt";
  import Dropdown, { type Option } from "$components/form/Dropdown.svelte";

  const t = useTranslations();

  interface Props {
    resellerCodeOptions: Option[];
    value?: string;
    statusFlags?: string[];
    resellerCode?: string;
    onsearch: Function;
    onfilter: Function;
  }

  let {
    resellerCodeOptions = [],
    value = $bindable(""),
    statusFlags = $bindable([]),
    resellerCode = $bindable(""),
    onsearch,
    onfilter,
  }: Props = $props();

  let typingTimeout: any;

  const flagOptions = [
    { label: t("tenant.flag-status.trial"), value: FlagStatus.Trial },
    { label: t("tenant.flag-status.internal"), value: FlagStatus.Internal },
    { label: t("tenant.flag-status.reseller"), value: FlagStatus.Reseller },
    { label: t("tenant.flag-status.archived"), value: FlagStatus.Archived },
  ];

  const onSearch = ({ target }: any) => {
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      value = target.value;
      onsearch();
    }, 300);
  };

  function onResellerCodeChange(value: string) {
    resellerCode = value;
    onfilter();
  }

  function toggleFlagStatus(value: string) {
    if (statusFlags.includes(value)) {
      statusFlags = statusFlags.filter((v) => v !== value);
    } else {
      statusFlags = [...statusFlags, value];
    }
    onfilter();
  }
</script>

<div class="px-5 py-5 bg-base-100 rounded-lg items-center mb-10">
  <div class="inline-flex items-center mb-2">
    {@html svgIcons.filter}
    <h3 class="ml-2 text-normal font-normal">
      {t("tenant.filter-label")}
    </h3>
  </div>

  <div class="grid grid-cols-1 xl:grid-cols-12 gap-10">
    <div class="col-span-3 xl:col-span-4">
      <p class="mb-1 text-base-content/80">{t("tenant.search-label")}</p>
      <label
        class="input input-bordered flex items-center gap-2 w-full max-w-sm
"
      >
        {@html svgIcons.search}
        <input
          type="text"
          class="grow"
          placeholder={t("tenant.tenants.seach-place-holder")}
          oninput={preventDefault(onSearch)}
        />
      </label>
    </div>
    <div class="col-span-6 xl:col-span-5">
      <p class="mb-2 text-base-content/80">
        {t("tenant.flag-status-label")}
      </p>
      <div class="grid grid-cols-2 lg:grid-cols-4 max-w-md pt-1 gap-2">
        {#each flagOptions as flag}
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              name="status_flag"
              value={flag.value}
              class="checkbox checkbox-sm checkbox-neutral"
              checked={statusFlags.includes(flag.value)}
              onclick={() => toggleFlagStatus(flag.value)}
            />
            <span class="text-sm font-normal">{flag.label}</span>
          </label>
        {/each}
      </div>
    </div>
    <div class="col-span-3 xl:col-span-3">
      <p class="mb-2 text-base-content/80">
        {t("tenant.filter-reseller-code-label")}
      </p>
      <Dropdown
        classes={"w-full"}
        options={resellerCodeOptions}
        placeholder={t("tenant.filter-reseller-code-placeholder")}
        bind:value={resellerCode}
        onValueChange={(value: string) => {
          onResellerCodeChange(value);
        }}
      />
    </div>
  </div>
</div>
