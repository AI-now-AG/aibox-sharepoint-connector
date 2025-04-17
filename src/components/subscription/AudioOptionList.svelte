<script lang="ts">
  import AudioOption from "./AudioOption.svelte";

  interface Props {
    options?: any[];
  }

  let { options = [] }: Props = $props();
  let selectedPackageIds: string[] = $state([]);
  function handleSelectPackage(id: string) {
    // TODO: Store data into storage
  }
</script>

{#each options as option}
  <AudioOption
    id={option.id}
    name={option.name}
    price={option.price}
    currency={option.currency}
    bind:selectedPackageIds
    onSelect={({ id }: { id: string }) => {
      selectedPackageIds.push(id);
      handleSelectPackage(id);
    }}
  />
{/each}
