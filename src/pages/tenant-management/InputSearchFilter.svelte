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

<div class="items-center mb-10">
  <div class="relative w-full">
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
  <div class="mt-4">
    <label class="flex items-center space-x-2">
      <input
        type="checkbox"
        class="checkbox border-gray-300 rounded-sm focus:ring-indigo-500 w-5 h-5"
        checked={showArchived}
        onclick={preventDefault(onFilter)}
      />
      <span class="label-text">{t("tenant.tenants.show-archived")}</span>
    </label>
  </div>
</div>
