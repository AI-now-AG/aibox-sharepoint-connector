<script lang="ts">
  import DropdownSection from "$components/DropdownSection.svelte";
  import { type Option } from "$components/DropdownOptions.svelte";
  import { fade } from "svelte/transition";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import type { KnowledgeBaseCardItem } from "./KnowledgeBaseList.svelte";
  import moment from "moment";

  const t = useTranslations();

  interface Props {
    isEditable: boolean;
    data: KnowledgeBaseCardItem;
    onSelectEdit?: Function;
    onSelectDuplicate?: Function;
    onSelectDelete?: Function;
  }

  let {
    isEditable,
    data,
    onSelectEdit,
    onSelectDuplicate,
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
  <div class="px-8 pb-4">
    <p class="text-xs font-medium">
      {t("common.edited-by")}
      {data?.modifiedBy}
    </p>
    <p class="text-xs font-medium">
      {data?.modifiedAt
        ? moment(data?.modifiedAt).format("DD.MM.YYYY, HH:mm")
        : "-"}
    </p>
  </div>
</div>
