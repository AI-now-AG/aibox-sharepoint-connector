<script>
  import { onDestroy } from "svelte";
  import { storePromptId } from "$components/prompt-interface/components/Stores";
  import InputArea from "$components/PromptConfiguration/InputArea.svelte";

  let selectedPromptId;
  let promptDetails = "";
  const unsubscribe = storePromptId.subscribe((value) => {
    if (value) {
      selectedPromptId = value;
      getPromptDetail(value);
    }
  });
  onDestroy(unsubscribe);

  async function getPromptDetail(id) {
    const response = await fetch(`/api/prompts.json?_id=${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      promptDetails = await response.json();
    } else {
      console.error("API call failed");
    }
  }
</script>

{#if promptDetails}
  <div class="mx-auto">
    <h2 class="pb-2">Prompt</h2>
    <div class="card border-2 border-base-300 border-2 bg-base-100 p-4 mb-4">
      <div>
        <p class="line-clamp-5 mb-2">
          {promptDetails?.prompt}
        </p>
        <button
          class="btn btn-sm btn-neutral btn-2 border-0 bg-base-200 text-neutral hover:text-neutral-content"
          onclick="my_modal_3.showModal()"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.3335 6.66659V3.33325M3.3335 3.33325H6.66683M3.3335 3.33325L7.50016 7.49992M16.6668 6.66659V3.33325M16.6668 3.33325H13.3335M16.6668 3.33325L12.5002 7.49992M3.3335 13.3333V16.6666M3.3335 16.6666H6.66683M3.3335 16.6666L7.50016 12.4999M16.6668 16.6666L12.5002 12.4999M16.6668 16.6666V13.3333M16.6668 16.6666H13.3335"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <h2 class="pb-2">Instruction</h2>
    <div class="card border-2 border-base-300 border-2 bg-base-100 p-4 mb-4">
      <div>
        <p class="line-clamp-5 mb-2">
          {promptDetails?.instructions[0].instruction}
        </p>
        <button
          class="btn btn-sm btn-neutral btn-2 border-0 bg-base-200 text-neutral hover:text-neutral-content"
          onclick="my_modal_3.showModal()"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.3335 6.66659V3.33325M3.3335 3.33325H6.66683M3.3335 3.33325L7.50016 7.49992M16.6668 6.66659V3.33325M16.6668 3.33325H13.3335M16.6668 3.33325L12.5002 7.49992M3.3335 13.3333V16.6666M3.3335 16.6666H6.66683M3.3335 16.6666L7.50016 12.4999M16.6668 16.6666L12.5002 12.4999M16.6668 16.6666V13.3333M16.6668 16.6666H13.3335"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <h2 class="pb-2">Knowledge base</h2>
    <div class="card border-2 border-base-300 border-2 bg-base-100 p-4 mb-4">
      <div>
        <p class="line-clamp-5 mb-2">
          {promptDetails?.knowledgebase[0].knowledge_base}
        </p>
        <button
          class="btn btn-sm btn-neutral btn-2 border-0 bg-base-200 text-neutral hover:text-neutral-content"
          onclick="my_modal_3.showModal()"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.3335 6.66659V3.33325M3.3335 3.33325H6.66683M3.3335 3.33325L7.50016 7.49992M16.6668 6.66659V3.33325M16.6668 3.33325H13.3335M16.6668 3.33325L12.5002 7.49992M3.3335 13.3333V16.6666M3.3335 16.6666H6.66683M3.3335 16.6666L7.50016 12.4999M16.6668 16.6666L12.5002 12.4999M16.6668 16.6666V13.3333M16.6668 16.6666H13.3335"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
{/if}

<dialog id="my_modal_3" class="modal">
  <div class="modal-box w-8/12 max-w-5xl">
    <h3 class="text-lg font-bold py-4">Prompt Configuration</h3>
    <form method="dialog">
      <button class="btn btn-sm btn-ghost absolute right-2 top-2">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 12L10 10M10 10L12 8M10 10L8 8M10 10L12 12M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z"
            stroke="#111827"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </form>
    <div role="tablist" class="tabs tabs-lifted">
      <input
        type="radio"
        name="my_tabs"
        role="tab"
        class="tab"
        aria-label="Prompt"
        checked="checked"
      />
      <div
        role="tabpanel"
        class="tab-content bg-base-100 border-base-300 rounded-box p-6"
      >
        <InputArea
          placeholder="Edit your prompt here..."
          promptText={promptDetails?.prompt}
        />
      </div>

      <input
        type="radio"
        name="my_tabs"
        role="tab"
        class="tab"
        aria-label="Instruction"
      />
      <div
        role="tabpanel"
        class="tab-content bg-base-100 border-base-300 rounded-box p-6"
      >
        {#if promptDetails?.instructions}
          {#each promptDetails?.instructions as instruction}
            <InputArea
              promptText={instruction.instruction}
              placeholder="Edit your instruction here..."
            />
          {/each}
        {/if}
      </div>

      <input
        type="radio"
        name="my_tabs"
        role="tab"
        class="tab"
        aria-label="Knowledge base"
      />
      <div
        role="tabpanel"
        class="tab-content bg-base-100 border-base-300 rounded-box p-6"
      >
        {#if promptDetails?.knowledgebase}
          {#each promptDetails?.knowledgebase as knowledgebase}
            <InputArea
              promptText={knowledgebase.knowledge_base}
              placeholder="Edit your instruction here..."
            />
          {/each}
        {/if}
      </div>
    </div>
    <div class="modal-action">
      <form method="dialog">
        <button class="btn btn-lg btn-primary font-normal" type="submit"
          >Save Global</button
        >
      </form>
    </div>
  </div>
</dialog>
