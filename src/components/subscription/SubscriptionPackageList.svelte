<script lang="ts">
  import { SubscriptionPackages } from "$subscription-packages.json";
  import SubscriptionPackage from "./SubscriptionPackage.svelte";

  const packages = [
    SubscriptionPackages.plan.starter,
    SubscriptionPackages.plan.team,
    SubscriptionPackages.plan.pro,
  ];
  interface Props {}
  let {}: Props = $props();

  let selectedPackageId = $state("");
  function handleSelectPackage(id: string) {
    selectedPackageId = id;
    // TODO: Store data into storage
  }
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
      handleSelectPackage(id);
    }}
  />
{/each}
