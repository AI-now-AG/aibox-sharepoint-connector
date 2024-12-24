<script lang="ts">
  import DropdownOptions, {
    type Option,
  } from "$components/DropdownOptions.svelte";
  import { svgIcons } from "$assets/icons";
  import { fade } from "svelte/transition";
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  export let isEditable: boolean;
  export let data: any;

  export let onSelectEdit: Function;
  export let onSelectDuplicate: Function;
  export let onSelectReOder: Function;
  export let onSelectDelete: Function;

  let options: Option[] = [
    {
      id: "1",
      icon: svgIcons.edit,
      text: t("common.edit"),
      action: () => {
        onSelectEdit?.();
      },
    },
    {
      id: "2",
      icon: svgIcons.duplicate,
      text: t("common.duplicate"),
      action: () => {
        onSelectDuplicate?.();
      },
    },
    {
      id: "3",
      icon: svgIcons.reOrder,
      text: t("common.change-order"),
      action: () => {
        onSelectReOder?.();
      },
    },
    {
      id: "4",
      icon: svgIcons.trash,
      text: t("common.delete"),
      action: () => {
        onSelectDelete?.();
      },
    },
  ];

  let isShowDropdownOption = false;
  const handleMouseEnter = () => {
    isShowDropdownOption = true;
  };
  const handleMouseLeave = () => {
    isShowDropdownOption = false;
  };
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
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <section
      class="absolute top-6 right-3 dropdown dropdown-hover dropdown-end z-50"
      on:mouseenter={handleMouseEnter}
      on:mouseleave={handleMouseLeave}
    >
      <button class="text-neutral hover:bg-slate-200 btn btn-ghost btn-sm z-50">
        <span class="pointer-events-none">
          {@html svgIcons.threeDot}
        </span>
      </button>
      {#if isShowDropdownOption}
        <DropdownOptions {options} />
      {/if}
    </section>
  {/if}
</div>
