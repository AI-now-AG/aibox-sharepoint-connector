<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { preventDefault } from "$utils/common";

  const t = useTranslations();

  interface Props {
    value?: string;
    showArchived?: boolean;
    onsearch: Function;
    onfilter: Function;
  }

  let {
    value = $bindable(""),
    showArchived = $bindable(false),
    onsearch,
    onfilter,
  }: Props = $props();
  let typingTimeout: any;

  const onSearch = ({ target }: any) => {
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      value = target.value;
      onsearch();
    }, 300);
  };

  const onFilter = ({ target }: any) => {
    showArchived = !showArchived;
    setTimeout(() => (target.checked = showArchived), 0);
    onfilter();
    console.log("dispatch filter", { value });
  };
</script>

<div class="px-5 py-5 bg-base-100 rounded-lg items-center mb-10">
  <div class="inline-flex items-center mb-2">
    {@html svgIcons.filter}
    <h3 class="ml-2 text-1xl font-bold">FILTER</h3>
  </div>

  <div class="flex items-center gap-6">
    <div class="flex-1">
      <p class="mb-1 label">Search</p>
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
      <p class="mb-1 label">Status Flags</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
        <label class="flex items-center space-x-2">
          <input type="radio" class="radio border-base-content w-5 h-5" />
          <span class="label-text">Trial</span>
        </label>
        <label class="flex items-center space-x-2">
          <input type="radio" class="radio border-base-content w-5 h-5" />
          <span class="label-text">Trial</span>
        </label>
        <label class="flex items-center space-x-2">
          <input type="radio" class="radio border-base-content w-5 h-5" />
          <span class="label-text">Reseller</span>
        </label>
        <label class="flex items-center space-x-2">
          <input
            type="radio"
            class="radio border-base-content w-5 h-5"
            checked={showArchived}
            onclick={preventDefault(onFilter)}
          />
          <span class="label-text">Archived</span>
        </label>
      </div>
    </div>
    <div class="flex-1">
      <p class="mb-1 label">Reseller Code</p>
    </div>
  </div>
</div>
