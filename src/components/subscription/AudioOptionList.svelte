<script lang="ts">
  import { SubscriptionPackages } from "$data/subscription-packages";
  import { AudioOptionId } from "$types/Subscription";
  import AudioOption from "./AudioOption.svelte";

  // Applied changes from this ticket: https://ainow.atlassian.net/browse/AINOW-1430
  const audioToTextOptions = [
    SubscriptionPackages.audioOptions.AudioBasis, // [Audio to Text Basic]
    SubscriptionPackages.audioOptions.AudioBasisAddOnLarge, // [Audio to Text Large]
  ];
  const subtitleStudioOptions = [
    SubscriptionPackages.audioOptions.AudioPremium, // [Subtitle Studio Plus]
  ];

  // Select [Subtitle Studio Plus] or [Subtitle Studio Basic] | [Audio to Text Large] or [Audio to Text Basic]
  const audioToTextGroup = [
    AudioOptionId.AudioBasis, // [Audio to Text Basic]
    AudioOptionId.AudioBasisAddOnLarge, // [Audio to Text Large]
  ];
  const subtitleStudioGroup = [
    AudioOptionId.AudioBasisAddOnSubtitle, // [Subtitle Studio Basic]
    AudioOptionId.AudioPremium, // [Subtitle Studio Plus]
  ];

  interface Props {
    selectedAudioOptionIds?: string[];
    defaultLanguage?: string;
  }
  let {
    selectedAudioOptionIds = $bindable([]),
    defaultLanguage = "en",
  }: Props = $props();

  function handleSelectPackage(id: string) {
    let currentGroup: AudioOptionId[] | undefined;

    if (audioToTextGroup.includes(id as AudioOptionId)) {
      currentGroup = audioToTextGroup as AudioOptionId[];
    } else if (subtitleStudioGroup.includes(id as AudioOptionId)) {
      currentGroup = subtitleStudioGroup as AudioOptionId[];
    }

    if (!currentGroup) return;

    const isSelected = selectedAudioOptionIds.includes(id);
    if (isSelected) {
      selectedAudioOptionIds = selectedAudioOptionIds.filter(
        (optionId) => optionId !== id,
      );
    } else {
      let newSelectionIds = selectedAudioOptionIds.filter(
        (optionId) => !currentGroup!.includes(optionId as AudioOptionId),
      );
      selectedAudioOptionIds = [...newSelectionIds, id];
    }
  }
</script>

<div class="block sm:block md:flex lg:flex">
  <div class="flex-1 mr-0 md:mr-4 lg:mr-4">
    {#each audioToTextOptions as option}
      <div class="mb-4">
        <AudioOption
          id={option.id}
          name={option.name}
          price={option.price}
          currency={option.currency}
          {defaultLanguage}
          bind:selectedAudioOptionIds
          onSelect={({ id }: { id: string }) => {
            handleSelectPackage(id);
          }}
        />
      </div>
    {/each}
  </div>
  <div class="flex-1 ml-0 md:ml-4 lg:ml-4">
    {#each subtitleStudioOptions as option}
      <div class="mb-4">
        <AudioOption
          id={option.id}
          name={option.name}
          price={option.price}
          currency={option.currency}
          {defaultLanguage}
          bind:selectedAudioOptionIds
          onSelect={({ id }: { id: string }) => {
            handleSelectPackage(id);
          }}
        />
      </div>
    {/each}
  </div>
</div>
