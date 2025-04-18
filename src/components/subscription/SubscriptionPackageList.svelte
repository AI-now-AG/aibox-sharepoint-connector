<script lang="ts">
  import { SubscriptionPackages } from "$subscription-packages.json";
  import SubscriptionPackage from "./SubscriptionPackage.svelte";

  const packages = [
    SubscriptionPackages.plan.Starter,
    SubscriptionPackages.plan.Teams,
    SubscriptionPackages.plan.Pro,
  ];
  interface Props {
    selectedPackageId?: string;
  }
  let { selectedPackageId = $bindable("") }: Props = $props();

  function handleSelectPackage(id: string) {
    selectedPackageId = id;
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
