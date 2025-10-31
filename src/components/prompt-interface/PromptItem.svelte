<script lang="ts">
  import DropdownSection from "$components/DropdownSection.svelte";
  import { type Option } from "$components/DropdownOptions.svelte";
  import { fade } from "svelte/transition";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { getModelName } from "$shared/AIProvider";
  import { tenant } from "$stores";

  const t = useTranslations();

  interface Props {
    isEditable: boolean;
    data: any;
    onSelectEdit?: Function;
    onSelectDuplicate?: Function;
    onSelectReorder?: Function;
    onSelectDelete?: Function;
    onItemSelect?: Function;
  }

  let {
    isEditable,
    data,
    onSelectEdit,
    onSelectDuplicate,
    onSelectReorder,
    onSelectDelete,
    onItemSelect,
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

<button
  class="card bg-base-100 shadow-xl"
  out:fade
  onclick={() => onItemSelect?.()}
>
  <div class="card-body space-y-2 justify-between">
    {#if data?.tags}
      <div class="card-actions justify-start mr-6">
        {#each data?.tags as tag}
          <div class="badge px-2 border-base-300">
            {tag}
          </div>
        {/each}
        <div class="badge px-2 border-base-300 bg-gray-200 font-semibold">
          {getModelName($tenant, data.model)}
        </div>
      </div>
    {/if}
    <h2 class="card-title">{data?.title}</h2>
    {#if data?.description}
      <p class="text-base-content/60 line-clamp-3 text-left">
        {data?.description}
      </p>
    {/if}
  </div>
  {#if isEditable}
    <DropdownSection class={"absolute top-6 right-3"} {options} />
  {/if}
</button>
