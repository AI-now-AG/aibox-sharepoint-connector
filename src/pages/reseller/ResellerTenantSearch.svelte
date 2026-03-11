<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { preventDefault } from "$utils/common";

  const t = useTranslations();

  interface Props {
    value?: string;
    onsearch: Function;
  }

  let { value = $bindable(""), onsearch }: Props = $props();

  let typingTimeout: any;

  const onSearch = ({ target }: any) => {
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      value = target.value;
      onsearch();
    }, 300);
  };
</script>

<div class="px-5 py-5 bg-base-100 rounded-lg items-center mb-10">
  <div class="inline-flex items-center mb-2">
    {@html svgIcons.filter}
    <h3 class="ml-2 text-normal font-normal">
      {t("reseller.dashboard.filter-label")}
    </h3>
  </div>

  <div class="grid grid-cols-1 xl:grid-cols-12 gap-10">
    <div class="col-span-3 xl:col-span-4">
      <p class="mb-1 text-base-content/80">
        {t("reseller.dashboard.search-label")}
      </p>
      <label
        class="input input-bordered flex items-center gap-2 w-full max-w-sm
"
      >
        {@html svgIcons.search}
        <input
          type="text"
          class="grow"
          placeholder={t("reseller.dashboard.seach-place-holder")}
          oninput={preventDefault(onSearch)}
        />
      </label>
    </div>
  </div>
</div>
