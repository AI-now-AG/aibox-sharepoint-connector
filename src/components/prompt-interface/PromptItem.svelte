<script lang="ts">
  import DropdownSection from "$components/DropdownSection.svelte";
  import { type Option } from "$components/DropdownOptions.svelte";
  import { fade } from "svelte/transition";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  interface Props {
    isEditable: boolean;
    data: any;
    onSelectEdit: () => void;
    onSelectDuplicate: () => void;
    onSelectReOder: () => void;
    onSelectDelete: () => void;
  }

  let {
    isEditable,
    data,
    onSelectEdit,
    onSelectDuplicate,
    onSelectReOder,
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

<div class="card bg-base-100 shadow-xl" out:fade>
  <div class="card-body space-y-2 justify-between">
    {#if data?.tags}
      <div class="card-actions justify-start">
        {#each data?.tags as tag}
          <div class="badge px-2 border-base-300">
            {tag}
          </div>
        {/each}
      </div>
    {/if}
    <h2 class="card-title">{data?.title}</h2>
    {#if data?.description}
      <p class="text-base-content/60 line-clamp-3">
        {data?.description}
      </p>
    {/if}
  </div>
  {#if isEditable}
    <DropdownSection class={"absolute top-6 right-3"} {options} />
  {/if}
</div>
