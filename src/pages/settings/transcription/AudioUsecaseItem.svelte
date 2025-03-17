<script lang="ts">
  import DropdownSection from "$components/DropdownSection.svelte";
  import { type Option } from "$components/DropdownOptions.svelte";
  import { fade } from "svelte/transition";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import type { AudioCardItem } from "$types/AudioCardItem";
  import { AudioCategoryLabels } from "$types/TenantFeature";

  const t = useTranslations();

  interface Props {
    isEditable: boolean;
    item: AudioCardItem;
    onSelectEdit?: Function;
    onSelectDuplicate?: Function;
    onSelectDelete?: Function;
    onSelecteEnabled?: Function;
  }

  let {
    isEditable,
    item = $bindable(),
    onSelectEdit,
    onSelectDuplicate,
    onSelectDelete,
    onSelecteEnabled,
  }: Props = $props();

  let options: Option[] = [
    {
      icon: svgIcons.edit,
      text: t("common.edit"),
      action: () => {
        onSelectEdit?.();
      },
    },
    // {
    //   icon: svgIcons.duplicate,
    //   text: t("common.duplicate"),
    //   action: () => {
    //     onSelectDuplicate?.();
    //   },
    // },
    {
      icon: item.enabled ? svgIcons.eyeClose : svgIcons.eye,
      text: item.enabled ? t("common.deactivate") : t("common.activate"),
      action: () => {
        onSelecteEnabled?.();
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

<div
  class="card bg-base-100 shadow-xl"
  aria-disabled={!isEditable}
  class:opacity-50={!isEditable}
  class:pointer-events-none={!isEditable}
  out:fade
>
  <div class="card-body space-y-2">
    <div class="flex justify-between">
      <div class="card-actions justify-start">
        <div class="badge px-2 border-base-300">
          {AudioCategoryLabels[item.category]}
        </div>
      </div>
      {#if isEditable}
        <DropdownSection {options} />
      {/if}
    </div>
    <div class="flex justify-between">
      <h2 class="card-title">{item.title}</h2>
      <!-- <input
        type="checkbox"
        bind:checked={item.enabled}
        onchange={(e) =>
          onSelecteEnabled?.((e.target as HTMLInputElement).checked)}
        class="toggle toggle-sm self-center"
      /> -->
      <span
        class={item.enabled === true
          ? "text-success text-sm font-medium"
          : "text-sm font-medium text-neutral/70"}
        >{item.enabled === true
          ? t("settings.transcription.usecase.active")
          : t("settings.transcription.usecase.inactive")}</span
      >
    </div>
    {#if item.instruction}
      <p class="text-base-content/60 line-clamp-3">
        {item.instruction}
      </p>
    {/if}
  </div>
</div>
