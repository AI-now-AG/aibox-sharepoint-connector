<script lang="ts" module>
  export interface PromptCardItem {
    id: string;
    title: string;
    description?: string;
    instruction?: string;
    category?: string;
    group?: string;
    tags?: string[];
    model?: string | null;
    predefined_input?: string;
  }
</script>

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
    <div class="card-actions justify-start mr-6 flex-wrap">
      {#if data?.tags && data?.tags.length > 0}
        {#each data?.tags as tag}
          <div
            class="badge badge-sm px-2 border-base-300 max-w-[10rem] inline-block truncate"
            title={tag}
          >
            {tag}
          </div>
        {/each}
      {/if}
      <div class="badge badge-sm px-2 border-base-300 bg-base-200 font-normal">
        {getModelName($tenant, data.model)}
      </div>
    </div>
    <h2 class="card-title text-base">{data?.title}</h2>
    {#if data?.description}
      <p class="text-base-content/60 text-sm line-clamp-4 text-left">
        {data?.description}
      </p>
    {/if}
  </div>
  {#if isEditable}
    <DropdownSection class={"absolute top-6 right-3"} {options} />
  {/if}
</button>
