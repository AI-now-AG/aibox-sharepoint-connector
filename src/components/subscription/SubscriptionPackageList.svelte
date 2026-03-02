<script lang="ts">
  import { SubscriptionPackages } from "$data/subscription-packages";
  import SubscriptionPackage from "./SubscriptionPackage.svelte";

  interface Props {
    selectedPackageId?: string;
    defaultLanguage?: string;
  }
  let { selectedPackageId = $bindable(""), defaultLanguage = "en" }: Props =
    $props();

  const packages = [
    SubscriptionPackages.plan.Starter,
    SubscriptionPackages.plan.Teams,
    SubscriptionPackages.plan.Pro,
  ];

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
    {defaultLanguage}
    bind:selectedPackageId
    onSelect={({ id }: { id: string }) => {
      handleSelectPackage(id);
    }}
  />
{/each}
