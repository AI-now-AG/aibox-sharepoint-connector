<script lang="ts" context="module">
  export interface CardItem {
    id: string;
    title: string;
    description?: string;
    badge1?: string;
    badge2?: string;
  }
</script>

<script lang="ts">
  import { fade } from "svelte/transition";

  export let enriched: CardItem[] = [];
  export let type: string = "";
  export let viewAllLabel: string = "";
  export let viewLabel: string = "";

  async function deleteCard(id: any) {
    const response = await fetch(`/api/${type}.json`, {
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
    {viewAllLabel}
  </h1>

  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
    {#each enriched as card}
      <div class="card bg-base-100 shadow-xl" out:fade>
        <div class="card-body space-y-2 justify-between">
          <div class="card-actions justify-start">
            {#if card.badge1}
              <div class="badge px-2 border-base-300">
                {card.badge1}
              </div>
            {/if}
            {#if card.badge2}
              <div class="badge px-2 border-base-300">
                {card.badge2}
              </div>
            {/if}
            <!-- <div
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
            {/if} -->
          </div>
          <h2 class="card-title">{card.title}</h2>
          {#if card.description}
            <p class="text-base-content/60 line-clamp-3">
              {card.description}
            </p>
          {/if}
          <div class="flex justify-between mt-4">
            <div class="card-actions">
              <a
                href={`${type}/${card.id}`}
                class="btn btn-primary font-light"
              >
                {viewLabel}
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
