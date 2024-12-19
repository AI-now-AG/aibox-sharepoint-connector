<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";

  export let onSelectEdit: Function;
  export let onSelectDuplicate: Function;
  export let onSelectReOder: Function;
  export let onSelectDelete: Function;

  const t = useTranslations();
</script>

<div
  class="absolute right-0 mt-1 w-48 md:w-44 bg-white rounded-xl shadow-xl z-50"
>
  <ul class="py-2">
    <li class="hover:bg-gray-200 cursor-pointer">
      <button
        class="flex items-center px-4 py-2 text-gray-700 font-sans w-full"
        on:click={(e) => {
          e.stopPropagation();
          onSelectEdit?.();
        }}
      >
        {@html svgIcons.edit}
        <span class="text-sm font-semibold ml-2">{t("common.edit")}</span>
      </button>
    </li>
    <li class="hover:bg-gray-200 cursor-pointer">
      <button
        class="flex items-center px-4 py-2 text-gray-700 font-sans w-full"
        on:click={(e) => {
          e.stopPropagation();
          onSelectDuplicate?.();
        }}
      >
        {@html svgIcons.duplicate}
        <span class="text-sm font-semibold ml-2">{t("common.duplicate")}</span>
      </button>
    </li>
    <li class="hover:bg-gray-200 cursor-pointer">
      <button
        class="flex items-center px-4 py-2 text-gray-700 font-sans w-full"
        on:click={(e) => {
          e.stopPropagation();
          onSelectReOder?.();
        }}
      >
        {@html svgIcons.reOrder}
        <span class="text-sm font-semibold ml-2"
          >{t("common.change-order")}</span
        >
      </button>
    </li>
    <li class="hover:bg-gray-200 cursor-pointer">
      <button
        class="flex items-center px-4 py-2 text-gray-700 font-sans w-full"
        on:click={(e) => {
          e.stopPropagation();
          onSelectDelete?.();
        }}
      >
        {@html svgIcons.deleteIcon}
        <span class="text-sm font-semibold ml-2">{t("common.delete")}</span>
      </button>
    </li>
  </ul>
</div>
