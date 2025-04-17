<script lang="ts">
  import SubscriptionPackage from "./SubscriptionPackage.svelte";

  interface Props {
    packages?: any[];
  }

  let { packages = [] }: Props = $props();
  let selectedPackageId = $state("");
</script>

{#each packages as packagesItem}
  <SubscriptionPackage
    id={packagesItem.id}
    name={packagesItem.name}
    description={packagesItem.description}
    price={packagesItem.price}
    currency={packagesItem.currency}
    features={packagesItem.features}
    bind:selectedPackageId
    onSelect={({ id }: { id: string }) => {
      selectedPackageId = id;
    }}
  />
{/each}
