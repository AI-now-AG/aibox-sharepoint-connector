<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { svgIcons } from "$assets/icons";
    import { useTranslations } from "$i18n/utils";
  
    const dispatch = createEventDispatcher();
    const t = useTranslations();
  
    export let value: string = "";
    export let showArchived: boolean = false;
    let typingTimeout: any;
  
    const onSearch = ({ target }: any) => {
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        value = target.value;
        dispatch("search");
        console.log('dispatch search', {value});
      }, 300);
    };

    const onFilter = ({ target }: any) => {
      showArchived = !showArchived;
      setTimeout(() => (target.checked = showArchived), 0);
      dispatch("filter");
      console.log('dispatch filter', {value});
    };
</script>
  
<div class="items-center mb-10">
  <div class="relative w-full">
    <label class="input input-bordered flex items-center gap-2">
      {@html svgIcons.search}
      <input
        type="text"
        class="grow text-sm"
        placeholder={t("tenant.tenants.seach-place-holder")}
        on:input={onSearch}
        on:input
        on:blur
      />
    </label>
  </div>
  <div class="mt-4">
    <label class="flex items-center space-x-2">
      <input
        type="checkbox"
        class="checkbox border-gray-300 rounded focus:ring-indigo-500 w-5 h-5"
        checked={showArchived}
        on:click|preventDefault={onFilter}
      />
      <span class="label-text">{t("tenant.tenants.show-archived")}</span>
    </label>
  </div>
</div>
