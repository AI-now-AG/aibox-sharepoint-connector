<script lang="ts">
  import DropdownOptions, {
    type Option,
  } from "$components/DropdownOptions.svelte";
  import ThreeDotButton from "$components/ThreeDotButton.svelte";

  export let options: Option[] = [];
  export let cssClasses: string = "";
</script>

<section class={`dropdown dropdown-hover dropdown-end ${cssClasses}`}>
  <ThreeDotButton />
  <DropdownOptions {options} />
</section>
