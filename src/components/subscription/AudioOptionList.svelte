<script lang="ts">
  import { SubscriptionPackages } from "$data/subscription-packages";
  import { AudioOptionId } from "$types/Subscription";
  import AudioOption from "./AudioOption.svelte";

  // Applied changes from this ticket: https://ainow.atlassian.net/browse/AINOW-1430
  const audioToTextOptions = [
    //SubscriptionPackages.audioOptions.AudioBasis, // [Audio to Text Basic]
    //SubscriptionPackages.audioOptions.AudioBasisAddOnLarge, // [Audio to Text Large]
    SubscriptionPackages.audioOptions.AudioToText, // [Audio to Text]
  ];
  const subtitleStudioOptions = [
    SubscriptionPackages.audioOptions.AudioPremium, // [Subtitle Studio Plus]
  ];

  // Select [Subtitle Studio Plus] or [Subtitle Studio Basic] | [Audio to Text Large] or [Audio to Text Basic]
  const audioToTextGroup = [
    //AudioOptionId.AudioBasis, // [Audio to Text Basic]
    //AudioOptionId.AudioBasisAddOnLarge, // [Audio to Text Large]
    AudioOptionId.AudioToText, // [Audio to Text]
  ];
  const subtitleStudioGroup = [
    AudioOptionId.AudioBasisAddOnSubtitle, // [Subtitle Studio Basic]
    AudioOptionId.AudioPremium, // [Subtitle Studio Plus]
  ];

  interface Props {
    selectedAudioOptionIds?: string[];
    selectedPackageId?: string;
    defaultLanguage?: string;
  }
  let {
    selectedAudioOptionIds = $bindable([]),
    selectedPackageId = "",
    defaultLanguage = "en",
  }: Props = $props();

  const isDisabled = $derived(!selectedPackageId);

  // Clear audio selections when plan is deselected
  $effect(() => {
    if (!selectedPackageId && selectedAudioOptionIds.length > 0) {
      selectedAudioOptionIds = [];
    }
  });

  function getResolvedPrice(option: (typeof audioToTextOptions)[0]) {
    if ("prices" in option && option.prices) {
      if (selectedPackageId && option.prices[selectedPackageId as keyof typeof option.prices]) {
        return option.prices[selectedPackageId as keyof typeof option.prices];
      }
      return Math.min(...Object.values(option.prices));
    }
    return option.price;
  }

  function getResolvedPricePrefix(option: (typeof audioToTextOptions)[0]) {
    if (selectedPackageId && "prices" in option) {
      return "";
    }
    return option.pricePrefix ?? "";
  }

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
          price={getResolvedPrice(option)}
          currency={option.currency}
          pricePrefix={getResolvedPricePrefix(option)}
          disabled={isDisabled}
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
          disabled={isDisabled}
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
