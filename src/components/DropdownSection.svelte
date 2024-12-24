<script lang="ts">
  import DropdownOptions, {
    type Option,
  } from "$components/DropdownOptions.svelte";
  import ThreeDotButton from "$components/ThreeDotButton.svelte";
  import { svgIcons } from "$assets/icons";

  export let options: Option[] = [];
  export let cssClasses: string = "";
  export let isShowDropdownOption: boolean = false;

  export let handleMouseEnter: any = () => null;
  export let handleMouseLeave: any = () => null;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<section
  class={`dropdown dropdown-hover dropdown-end ${cssClasses}`}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <ThreeDotButton />
  {#if isShowDropdownOption}
    <DropdownOptions {options} />
  {/if}
</section>
