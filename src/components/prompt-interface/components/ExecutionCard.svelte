<script>
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { storePromptId } from "$components/prompt-interface/components/Stores";

  export let preferredLocale;
  export let cards;
  export let selectedPromptId;

  const t = useTranslations(preferredLocale);

  let showMore = false;
  let selectedCardIndex = null;

  const promptLimit = 5;

  // TODO: Remove below function once default prompt functionality implemented
  onMount(async function () {
    selectedCardIndex = 0;
    selectedPromptId = cards[0]._id;
    storePromptId.set(selectedPromptId);
  });

  function selectCard(index) {
    const promptId = cards[index]._id;
    selectedCardIndex = index;
    // selectedCardIndex = index === selectedCardIndex ? null : index;
    selectedPromptId = promptId;
    storePromptId.set(selectedPromptId);
  }
</script>

<div class="flex flex-col">
  <div
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 py-2"
  >
    {#each cards as card, index}
      {#if index < promptLimit || showMore}
        <button
          class={`transition-all duration-500 ease-in-out transform scale-95 opacity-0 animate-slide-in card outline-base-300 p-6 ${selectedCardIndex === index ? "bg-primary text-base-100" : "outline outline-2 text-base-content"}`}
          on:click={() => selectCard(index)}
        >
          <p class="card-title text-sm font-normal">{card.title}</p>
        </button>
      {/if}
    {/each}
  </div>

  {#if cards.length > promptLimit}
    <div class="flex">
      <button
        class="btn p-0 btn-link text-sm font-normal"
        on:click={() => (showMore = !showMore)}
      >
        {showMore
          ? `${t("prompt-execution.card.showMore")} ↑`
          : `${t("prompt-execution.card.showLess")} ↓`}
      </button>
    </div>
  {/if}
</div>
