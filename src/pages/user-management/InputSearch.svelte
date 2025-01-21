<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";

  const dispatch = createEventDispatcher();
  const t = useTranslations();

  export let value: string = "";
  let typingTimeout: any;

  const onSearch = ({ target }: any) => {
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      value = target.value;
      dispatch("search");
      console.log("dispatch", { value });
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
        on:input={onSearch}
        on:input
        on:blur
      />
    </label>
  </div>
</div>
