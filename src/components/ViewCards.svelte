<script lang="ts">
  import { fade } from "svelte/transition";
  import { CardType, type CardItem } from "$utils/types";
  import { useTranslations } from "$i18n/utils";

  export let preferredLocale;
  const t = useTranslations(preferredLocale);
  export let enriched: CardItem[] = [];
  export let cardType: CardType = CardType.Prompt;
  export let viewLabel: string = "";

  async function deleteCard(id: any) {
    const response = await fetch(`/api/${cardType}.json`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ _id: id }),
    });

    if (response.ok) {
      enriched = enriched.filter((card) => card.id !== id);
    } else {
      console.error("API call failed");
    }
  }
</script>

<div class="container max-w-5xl mx-auto p-6 space-y-4">
  <h1 class="text-lg font-normal text-base-content/80">
    {viewLabel}
  </h1>

  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
    {#each enriched as card}
      <div class="card bg-base-100 shadow-xl" out:fade>
        <div class="card-body space-y-2 justify-between">
          <div class="card-actions justify-start">
            <div
              class={`badge px-2 ${cardType == CardType.Prompt ? "border-base-300" : "bg-neutral text-neutral-content"}`}
            >
              {#if cardType === CardType.Prompt}
                {card.categoryName}
              {:else}
                {card.number}
              {/if}
            </div>
            {#if cardType === CardType.Prompt}
              <div class="badge px-2 border-base-300">{card.groupName}</div>
            {/if}
          </div>
          <h2 class="card-title">{card.title}</h2>
          {#if cardType === CardType.Prompt}
            <p class="text-base-content/60 line-clamp-3">
              {card.description}
            </p>
          {/if}
          <div class="flex justify-between mt-4">
            <div class="card-actions">
              <a
                href={`${cardType}/${card.id.toString()}`}
                class="btn btn-primary font-light"
              >
                {#if cardType === CardType.Prompt}
                  {t("prompt-library.prompts.view")}
                {:else if cardType === CardType.Instruction}
                  {t("prompt-library.instructions.view")}
                {:else if cardType === CardType.Knowledgebase}
                  {t("prompt-library.knowledgebase.view")}
                {:else}
                  {t("prompt-library.categories.view")}
                {/if}
              </a>
            </div>
            <button
              class="btn btn-link btn-xs font-normal text-accent-content self-end"
              on:click={() => deleteCard(card.id)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
