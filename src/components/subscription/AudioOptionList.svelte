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

  interface Props {
    selectedAudioOptionIds?: string[];
  }
  let { selectedAudioOptionIds = $bindable([]) }: Props = $props();

  function handleSelectPackage(id: string) {
    if (id == AudioOptionId.AudioPermium) {
      selectedAudioOptionIds = selectedAudioOptionIds.filter(
        (item) => item === AudioOptionId.AudioPermium,
      );
      if (selectedAudioOptionIds.includes(id)) {
        selectedAudioOptionIds = selectedAudioOptionIds.filter(
          (item) => item !== id,
        );
      } else {
        selectedAudioOptionIds.push(id);
      }
    } else {
      selectedAudioOptionIds = selectedAudioOptionIds.filter(
        (item) => item !== AudioOptionId.AudioPermium,
      );
      if (selectedAudioOptionIds.includes(id)) {
        selectedAudioOptionIds = selectedAudioOptionIds.filter(
          (item) => item !== id,
        );
      } else {
        selectedAudioOptionIds.push(id);
      }
    }
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
          bind:selectedAudioOptionIds
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
          bind:selectedAudioOptionIds
          onSelect={({ id }: { id: string }) => {
            handleSelectPackage(id);
          }}
        />
      </div>
    {/each}
  </div>
</div>
