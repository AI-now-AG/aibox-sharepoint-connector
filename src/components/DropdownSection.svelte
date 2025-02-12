<script lang="ts">
  import DropdownOptions, {
    type Option,
  } from "$components/DropdownOptions.svelte";
  import ThreeDotButton from "$components/ThreeDotButton.svelte";

  interface Props {
    options?: Option[];
  }

  let props: any = $props();
  let { options = [] }: Props = props;
  /* let styleVisibility: string = $state("");

   let isShowDropdownOption = $state(false);
  const handleMouseEnter = () => {
    // isShowDropdownOption = true;
    // styleVisibility = "visibility: visible;";
  };
  const handleMouseLeave = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    isShowDropdownOption = false;
    styleVisibility = "";
  };*/
</script>

<!-- <div
  class={`dropdown dropdown-hover dropdown-end ${props.class ?? ""}`}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  onclick={handleMouseEnter}
>
  <ThreeDotButton />
  {#if isShowDropdownOption}
    <DropdownOptions {options} bind:styleVisibility />
  {/if}
</div> -->
<div class={`dropdown dropdown-hover ${props.class ?? ""}`}>
  <ThreeDotButton />
  <DropdownOptions {options} />
</div>
