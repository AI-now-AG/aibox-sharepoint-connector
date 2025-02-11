<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  interface Props {
    value?: string;
    search?: Function;
    blur?: Function;
  }

  let {
    value = $bindable(""),
    search = () => null,
    blur = () => null,
  }: Props = $props();
  let typingTimeout: any;

  const onSearch = ({ target }: any) => {
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      value = target.value;
      search();
    }, 300);
  };

  const onBlur = () => {
    blur();
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
        onblur={onBlur}
      />
    </label>
  </div>
</div>
