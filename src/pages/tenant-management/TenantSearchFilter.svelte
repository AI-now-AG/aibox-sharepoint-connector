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
    statusFlag?: string;
    resellerCode?: string;
    onsearch: Function;
    onfilter: Function;
  }

  let {
    resellerCodeOptions = [],
    value = $bindable(""),
    statusFlag = $bindable(""),
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
    statusFlag = statusFlag === value ? "" : value;
    onfilter();
  }
</script>

<div class="px-5 py-5 bg-base-100 rounded-lg items-center mb-10">
  <div class="inline-flex items-center mb-2">
    {@html svgIcons.filter}
    <h3 class="ml-2 text-1xl font-bold">FILTER</h3>
  </div>

  <div class="flex items-center gap-10">
    <div class="flex-1">
      <p class="mb-1 label">{t("tenant.search-label")}</p>
      <label class="input input-bordered flex items-center gap-2 w-full">
        {@html svgIcons.search}
        <input
          type="text"
          class="grow text-sm"
          placeholder={t("tenant.tenants.seach-place-holder")}
          oninput={preventDefault(onSearch)}
        />
      </label>
    </div>
    <div class="flex-1">
      <p class="mb-2 label">{t("tenant.flag-status-label")}</p>
      <div class="grid grid-cols-2 2xl:grid-cols-4 gap-2">
        {#each flagOptions as flag}
          <label class="flex items-center space-x-2">
            <input
              type="radio"
              name="status_flag"
              value={flag.value}
              class="radio border-base-content w-5 h-5"
              checked={statusFlag === flag.value}
              onclick={() => toggleFlagStatus(flag.value)}
            />
            <span class="label-text">{flag.label}</span>
          </label>
        {/each}
      </div>
    </div>
    <div class="flex-1">
      <div class="pl-0 lg:pl-24">
        <p class="mb-2 label">{"Reseller Code"}</p>
        <Dropdown
          classes={"w-full"}
          options={resellerCodeOptions}
          bind:value={resellerCode}
          onValueChange={(value: string) => {
            onResellerCodeChange(value);
          }}
        />
      </div>
    </div>
  </div>
</div>
