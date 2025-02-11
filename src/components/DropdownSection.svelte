<script lang="ts">
  import DropdownOptions, {
    type Option,
  } from "$components/DropdownOptions.svelte";
  import ThreeDotButton from "$components/ThreeDotButton.svelte";

  interface Props {
    options?: Option[];
    cssClasses?: string;
  }

  let { options = [], cssClasses = "" }: Props = $props();
  let styleVisibility: string = $state("");

  let isShowDropdownOption = $state(false);
  const handleMouseEnter = () => {
    isShowDropdownOption = true;
    styleVisibility = "visibility: visible;";
  };
  const handleMouseLeave = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    isShowDropdownOption = false;
    styleVisibility = "";
  };
</script>

<button
  class={`dropdown dropdown-hover dropdown-end ${cssClasses}`}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  onclick={handleMouseEnter}
>
  <ThreeDotButton />
  {#if isShowDropdownOption}
    <DropdownOptions {options} bind:styleVisibility />
  {/if}
</button>
