<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  import DropdownOptions, {
    type Option,
  } from "$components/DropdownOptions.svelte";

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

{#if options.length >= 1}
  <button
    class={`relative btn w-full rounded-xl h-auto p-6 ${active ? "btn-primary " : "btn-outline border-base-300 border-2"} flex`}
    on:click={() => {
      onSelectCart?.(data);
    }}
    style={`z-index: ${zIndex};`}
  >
    {#if isEditable}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <section
        class="absolute top-1 right-1 dropdown dropdown-hover dropdown-end z-50"
        on:mouseenter={handleMouseEnter}
        on:mouseleave={handleMouseLeave}
      >
        <button
          class="${active
            ? 'text-white hover:text-black'
            : 'text-neutral hover:text-black'} hover:bg-slate-200 btn btn-ghost btn-sm z-50"
        >
          <span class="pointer-events-none">
            {@html svgIcons.threeDot}
          </span>
        </button>

        {#if isShowDropdownOption}
          <DropdownOptions {options} />
        {/if}
      </section>
    {/if}
    <p class="card-title text-sm font-normal">{data?.title ?? ""}</p>
  </button>
{/if}
