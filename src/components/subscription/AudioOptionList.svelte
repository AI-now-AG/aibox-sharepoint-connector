<script lang="ts">
  import {
    AudioOptionId,
    SubscriptionPackages,
  } from "$subscription-packages.json";
  import AudioOption from "./AudioOption.svelte";

  const basicOptions = [
    SubscriptionPackages.audioOptions.audioBasis,
    SubscriptionPackages.audioOptions.audioAddOnSubtitle,
    SubscriptionPackages.audioOptions.audioAddOnLarge,
  ];
  const pemiumOptions = [SubscriptionPackages.audioOptions.audioPremium];

  interface Props {}
  let {}: Props = $props();

  let selectedPackageIds: string[] = $state([]);
  function handleSelectPackage(id: string) {
    if (id == AudioOptionId.AudioPermium) {
      selectedPackageIds = selectedPackageIds.filter(
        (item) => item === AudioOptionId.AudioPermium,
      );
      if (selectedPackageIds.includes(id)) {
        selectedPackageIds = selectedPackageIds.filter((item) => item !== id);
      } else {
        selectedPackageIds.push(id);
      }
    } else {
      selectedPackageIds = selectedPackageIds.filter(
        (item) => item !== AudioOptionId.AudioPermium,
      );
      if (selectedPackageIds.includes(id)) {
        selectedPackageIds = selectedPackageIds.filter((item) => item !== id);
      } else {
        selectedPackageIds.push(id);
      }
    }
    // TODO: Store data into storage
  }
</script>

<div class="flex">
  <div class="flex-1">
    {#each basicOptions as option}
      <div class="mb-4">
        <AudioOption
          id={option.id}
          name={option.name}
          price={option.price}
          currency={option.currency}
          bind:selectedPackageIds
          onSelect={({ id }: { id: string }) => {
            handleSelectPackage(id);
          }}
        />
      </div>
    {/each}
  </div>
  <div class="flex-1 ml-2">
    {#each pemiumOptions as option}
      <div class="mb-4">
        <AudioOption
          id={option.id}
          name={option.name}
          price={option.price}
          currency={option.currency}
          bind:selectedPackageIds
          onSelect={({ id }: { id: string }) => {
            handleSelectPackage(id);
          }}
        />
      </div>
    {/each}
  </div>
</div>
