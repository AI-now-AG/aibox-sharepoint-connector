<script lang="ts" context="module">
  export interface CardItem {
    id: string;
    title: string;
    description?: string;
    tags?: string[];
  }
</script>

<script lang="ts">
  import { fade } from "svelte/transition";
  import { addToast } from "$stores/toast";

  export let items: CardItem[] = [];
  export let type: string = "";
  export let title: string = "";
  export let viewLabel: string = "";
  export let isEditable: boolean = false;

  const showDeleteConfirmationDlg = (id: string) => {
    document
      .querySelector<HTMLDialogElement>(`#delete_confirmation_modal_${id}`)
      ?.showModal();
  };

  async function deleteCard(id: string) {
    try {
      const response = await fetch(`/api/${type}.json`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: id }),
      });

      if (response.ok) {
        items = items.filter((card) => card.id !== id);

        addToast({
          message: `${type === "categories" ? "Category" : type === "knowledge-base" ? "Knowledge Base" : "Prompt"} deleted successfully.`,
          type: "success",
        });
        if (type === "categories") {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      addToast({
        message: `Error deleting ${type === "categories" ? "category" : type === "knowledge-base" ? "knowledge base" : "prompt"}. Please try again.`,
        type: "error",
      });
    }
  }
</script>

<div class="container max-w-5xl mx-auto p-6 space-y-4">
  <h1 class="text-lg font-normal text-base-content/80">
    {title}
  </h1>

  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
    {#each items as card}
      <div class="card bg-base-100 shadow-xl" out:fade>
        <div class="card-body space-y-2 justify-between">
          {#if card.tags}
            <div class="card-actions justify-start">
              {#each card.tags as tag}
                <div class="badge px-2 border-base-300">
                  {tag}
                </div>
              {/each}
            </div>
          {/if}
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
                class="btn btn-primary font-normal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                  class="w-6 h-6"
                  ><path
                    fill="currentColor"
                    d="M3 21v-4.25L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763t-.438.662L7.25 21zM17.6 7.8L19 6.4L17.6 5l-1.4 1.4z"
                  /></svg
                >
                {viewLabel}
              </a>
            </div>
            {#if isEditable}
              <button
                class="btn btn-sm btn-ghost text-error self-end"
                on:click={() => {
                  showDeleteConfirmationDlg(card.id);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                  class="w-6 h-6"
                  ><path
                    fill="currentColor"
                    d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zm2-4h2V8H9zm4 0h2V8h-2z"
                  /></svg
                >
              </button>
            {/if}

            <dialog id={`delete_confirmation_modal_${card.id}`} class="modal">
              <div class="modal-box">
                <h3 class="text-lg font-bold">Please confirm</h3>
                <p class="py-4">
                  Are you sure you want to delete <span class="font-bold"
                    >{card.title}</span
                  >?
                </p>
                <div class="modal-action">
                  <form method="dialog">
                    <!-- if there is a button in form, it will close the modal -->
                    <button class="btn">Cancel</button>
                    <button
                      class="btn btn-sm btn-ghost text-error self-end"
                      on:click={() => deleteCard(card.id)}
                    >
                      Delete</button
                    >
                  </form>
                </div>
              </div>
            </dialog>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
