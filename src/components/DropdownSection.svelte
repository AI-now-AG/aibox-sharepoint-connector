<script lang="ts">
  import DropdownOptions, {
    type Option,
  } from "$components/DropdownOptions.svelte";
  import ThreeDotButton from "$components/ThreeDotButton.svelte";

  export let options: Option[] = [];
  export let cssClasses: string = "";
  let styleVisibility: string = "";

  let isShowDropdownOption = false;
  const handleMouseEnter = () => {
    isShowDropdownOption = true;
    styleVisibility = "visibility: visible;";
  };
  const handleMouseLeave = () => {
    isShowDropdownOption = false;
    styleVisibility = "";
  };
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<button
  class={`dropdown dropdown-hover dropdown-end ${cssClasses}`}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:click|stopPropagation={handleMouseEnter}
>
  <ThreeDotButton />
  {#if isShowDropdownOption}
    <DropdownOptions {options} bind:styleVisibility />
  {/if}
</button>
