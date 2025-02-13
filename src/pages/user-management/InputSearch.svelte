<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";

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

<div class="items-center mb-2">
  <div class="relative w-full">
    <label class="input input-bordered flex items-center gap-2">
      {@html svgIcons.search}
      <input
        type="text"
        class="grow text-sm"
        placeholder={t("user.search-for-users")}
        oninput={onSearch}
      />
    </label>
  </div>
</div>
