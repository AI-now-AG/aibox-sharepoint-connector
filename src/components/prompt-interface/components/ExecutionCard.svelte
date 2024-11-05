<script lang="ts">
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { storePromptId } from "$components/prompt-interface/components/Stores";
  import { svgIcons } from "$assets/icons";
  import EditPromptDetails from "./EditPromptDetails.svelte";

  export let cards: any;
  export let selectedPromptId;

  const t = useTranslations();

  let showMore = false;
  let selectedCardIndex: number = -1;
  let dlgEl: HTMLDialogElement;
  const promptLimit = 5;
  let selectedEditPromptId: any = null;
  let isEditable = false;

  // TODO: Remove below function once default prompt functionality implemented
  onMount(async function () {
    selectedCardIndex = 0;
    selectedPromptId = cards[0]._id;
    storePromptId.set(selectedPromptId);
    if (selectedEditPromptId) {
      dlgEl.showModal();
    }
  });

  function selectCard(index: number) {
    const promptId = cards[index]._id;
    selectedCardIndex = index;
    // selectedCardIndex = index === selectedCardIndex ? null : index;
    selectedPromptId = promptId;
    storePromptId.set(selectedPromptId);
  }

  async function editCard(index: number) {
    const promptId = cards[index]._id;
    selectedEditPromptId = promptId;
    dlgEl.showModal();
  }
</script>

<div class="flex flex-col">
  <div
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 py-2"
  >
    {#each cards as card, index}
      {#if index < promptLimit || showMore}
        <button
          class={`relative btn w-full rounded-xl h-auto p-6 ${selectedCardIndex === index ? "btn-primary " : "btn-outline border-base-300 border-2"}`}
          on:click={() => selectCard(index)}
        >
          {#if isEditable}
            <button
              class="absolute top-2 right-2 ${selectedCardIndex === index
                ? 'text-white '
                : 'text-neutral'}"
              on:click={(event) => {
                event.stopPropagation();
                editCard(index);
              }}
            >
              {@html svgIcons.editPrompt}
            </button>
          {/if}
          <p class="card-title text-sm font-normal text-left mt-4">
            {card.title}
          </p>
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
          ? `${t("prompt-execution.card.showLess")} ↑`
          : `${t("prompt-execution.card.showMore")} ↓`}
      </button>
    </div>
  {/if}
</div>

<EditPromptDetails bind:dlgEl bind:selectedEditPromptId />
