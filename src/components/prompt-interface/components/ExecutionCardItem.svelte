<script lang="ts">
  import DropdownSection from "$components/DropdownSection.svelte";
  import { type Option } from "$components/DropdownOptions.svelte";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  export let active: boolean;
  export let isEditable: boolean;
  export let data: any;
  export let zIndex: number = 1;

  export let onSelectCart: Function;
  export let onSelectEdit: Function;
  export let onSelectDuplicate: Function;
  export let onSelectReOder: Function;
  export let onSelectDelete: Function;

  let options: Option[] = [
    {
      icon: svgIcons.edit,
      text: t("common.edit"),
      action: () => {
        onSelectEdit?.();
      },
    },
    {
      icon: svgIcons.duplicate,
      text: t("common.duplicate"),
      action: () => {
        onSelectDuplicate?.();
      },
    },
    {
      icon: svgIcons.reOrder,
      text: t("common.change-order"),
      action: () => {
        onSelectReOder?.();
      },
    },
    {
      icon: svgIcons.trash,
      text: t("common.delete"),
      action: () => {
        onSelectDelete?.();
      },
    },
  ];
</script>

{#if options.length >= 1}
  <button
    class={`relative btn w-full rounded-xl h-auto p-6 ${active ? "btn-primary " : "btn-outline border-base-300 border-2"} flex`}
    on:click={() => {
      onSelectCart?.(data);
    }}
    style={`z-index: ${zIndex};`}
  >
    {#if isEditable}
      <DropdownSection cssClasses={"absolute top-1 right-1"} {options} />
    {/if}
    <p class="card-title text-sm font-normal">{data?.title ?? ""}</p>
  </button>
{/if}
