<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  import PromptDropdownOptions from "./PromptDropdownOptions.svelte";

  export let active: boolean;
  export let isEditable: boolean;
  export let data: any;
  export let zIndex: number = 10;

  export let onSelectCart: Function;
  export let onSelectEdit: Function;
  export let onSelectDuplicate: Function;
  export let onSelectReOder: Function;
  export let onSelectDelete: Function;

  const t = useTranslations();
  let isShowDropdownOption = false;
  const handleMouseEnter = () => {
    isShowDropdownOption = true;
  };
  const handleMouseLeave = () => {
    isShowDropdownOption = false;
  };
</script>

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
      class="absolute top-2 right-2 w-5 h-5"
      on:mouseenter={handleMouseEnter}
      on:mouseleave={handleMouseLeave}
    >
      <div
        class="${active
          ? 'text-white hover:text-black'
          : 'text-neutral hover:text-black'} flex items-center justify-center rounded hover:bg-[#BDC0C3] w-5 h-5"
      >
        {@html svgIcons.threeDot}
      </div>

      {#if isShowDropdownOption}
        <PromptDropdownOptions
          onSelectEdit={() => {
            handleMouseLeave();
            onSelectEdit?.(data);
          }}
          onSelectDuplicate={() => {
            handleMouseLeave();
            onSelectDuplicate?.(data);
          }}
          onSelectReOder={() => {
            handleMouseLeave();
            onSelectReOder?.(data);
          }}
          onSelectDelete={() => {
            handleMouseLeave();
            onSelectDelete?.(data);
          }}
        />
      {/if}
    </section>
  {/if}
  <p class="card-title text-sm font-normal">{data?.title ?? ""}</p>
</button>
