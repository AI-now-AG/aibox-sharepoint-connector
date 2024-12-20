<script lang="ts">
  import PromptDropdownOptions from "$components/prompt-interface/components/PromptDropdownOptions.svelte";
  import { svgIcons } from "$assets/icons";
  import { fade } from "svelte/transition";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";
  import log from "$utils/log";

  const t = useTranslations();

  export let isEditable: boolean;
  export let data: any;

  export let onSelectEdit: Function;
  export let onSelectDuplicate: Function;
  export let onSelectReOder: Function;
  export let onSelectDelete: Function;

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
      class="absolute top-2 right-2 w-5 h-5"
      on:mouseenter={handleMouseEnter}
      on:mouseleave={handleMouseLeave}
    >
      <div class="text-neutral hover:text-black flex items-center justify-center rounded hover:bg-[#BDC0C3] w-5 h-5">
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
</div>
