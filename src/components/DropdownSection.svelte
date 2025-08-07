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
</script>

<div class={`dropdown dropdown-hover ${props.class ?? ""}`}>
  <ThreeDotButton />
  <DropdownOptions {options} />
</div>
