<script lang="ts">
  import DropdownSection from "$components/DropdownSection.svelte";
  import { type Option } from "$components/DropdownOptions.svelte";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  interface Props {
    active: boolean;
    isEditable: boolean;
    data: any;
    zIndex?: number;
    onSelectCart: (data: any) => void;
    onSelectEdit?: Function;
    onSelectDuplicate?: Function;
    onSelectReorder?: Function;
    onSelectDelete?: Function;
  }

  let {
    active,
    isEditable,
    data,
    zIndex = 1,
    onSelectCart,
    onSelectEdit,
    onSelectDuplicate,
    onSelectReorder,
    onSelectDelete,
  }: Props = $props();

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
      icon: svgIcons.reorder,
      text: t("common.change-order"),
      action: () => {
        onSelectReorder?.();
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
    class={`relative btn w-full rounded-xl h-auto min-h-18 p-3 ${active ? "btn-primary " : "btn-outline border-1 border-base-content/30"} flex`}
    onclick={() => {
      onSelectCart?.(data);
    }}
    style={`z-index: ${zIndex};`}
  >
    <div class="absolute top-2 left-2 badge badge-xs px-2 border-base-300 font-normal">
      {data?.modelName || t("tenant.default").toLowerCase()}
    </div>

    {#if isEditable}
      <DropdownSection class={"absolute top-1 right-1"} {options} />
    {/if}
    <p class="card-title text-sm font-normal mt-4">{data?.title ?? ""}</p>
  </button>
{/if}
