<script lang="ts">
  import {
    AudioOptionId,
    SubscriptionPackages,
  } from "$subscription-packages.json";
  import AudioOption from "./AudioOption.svelte";

  const basicOptions = [
    SubscriptionPackages.audioOptions.AudioBasis,
    SubscriptionPackages.audioOptions.AudioBasisAddOnSubtitle,
    SubscriptionPackages.audioOptions.AudioBasisAddOnLarge,
  ];
  const pemiumOptions = [SubscriptionPackages.audioOptions.AudioPremium];

  interface Props {
    selectedAudioOptionIds?: string[];
  }
  let { selectedAudioOptionIds = $bindable([]) }: Props = $props();

  const isDisabled = (optionId: string) => {
    return (
      (optionId === AudioOptionId.AudioBasisAddOnSubtitle ||
        optionId === AudioOptionId.AudioBasisAddOnLarge) &&
      !selectedAudioOptionIds.includes(AudioOptionId.AudioBasis)
    );
  };

  function handleSelectPackage(id: string) {
    // If AudioPremium is selected
    if (id === AudioOptionId.AudioPremium) {
      // Remove all basic options and only keep AudioPremium
      selectedAudioOptionIds = [AudioOptionId.AudioPremium];
    }
    // If AudioBasis is selected or unselected
    else if (id === AudioOptionId.AudioBasis) {
      if (selectedAudioOptionIds.includes(AudioOptionId.AudioBasis)) {
        // If AudioBasis is being unselected, remove all basic options
        selectedAudioOptionIds = selectedAudioOptionIds.filter(
          (optionId) =>
            ![
              AudioOptionId.AudioBasis,
              AudioOptionId.AudioBasisAddOnSubtitle,
              AudioOptionId.AudioBasisAddOnLarge,
            ].includes(optionId),
        );
      } else {
        // If AudioBasis is being selected, remove AudioPremium if present
        selectedAudioOptionIds = selectedAudioOptionIds.filter(
          (optionId) => optionId !== AudioOptionId.AudioPremium,
        );
        // Add AudioBasis
        selectedAudioOptionIds = [
          ...selectedAudioOptionIds,
          AudioOptionId.AudioBasis,
        ];
      }
    }
    // For AddOn options (Subtitle and Large)
    else if (
      [
        AudioOptionId.AudioBasisAddOnSubtitle,
        AudioOptionId.AudioBasisAddOnLarge,
      ].includes(id)
    ) {
      // Only allow selection if AudioBasis is selected
      if (selectedAudioOptionIds.includes(AudioOptionId.AudioBasis)) {
        if (selectedAudioOptionIds.includes(id)) {
          // If already selected, remove it (toggle off)
          selectedAudioOptionIds = selectedAudioOptionIds.filter(
            (optionId) => optionId !== id,
          );
        } else {
          // If not selected, add it (toggle on)
          selectedAudioOptionIds = [...selectedAudioOptionIds, id];
        }
      }
    }
  }
</script>

<div class="block sm:block md:flex lg:flex">
  <div class="flex-1 mr-0 md:mr-4 lg:mr-4">
    {#each basicOptions as option}
      <div class="mb-4">
        <AudioOption
          id={option.id}
          name={option.name}
          price={option.price}
          currency={option.currency}
          disabled={isDisabled(option.id)}
          bind:selectedAudioOptionIds
          onSelect={({ id }: { id: string }) => {
            handleSelectPackage(id);
          }}
        />
      </div>
    {/each}
  </div>
  <div class="flex-1 ml-0 md:ml-4 lg:ml-4">
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
