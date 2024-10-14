<script lang="ts">
  import { onDestroy } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { storePromptId } from "$components/prompt-interface/components/Stores";
  import InputArea from "$components/PromptConfiguration/InputArea.svelte";
  import type { CreateInstructionParams } from "$pages/api/instructions.json";
  import type { CreateKnowledgeBaseParams } from "$pages/api/knowledge-base.json";
  import type { PromptDetails } from "$pages/api/prompts/[id].json";
  
  const t = useTranslations();

  let selectedPromptId = "";
  let promptDetails: PromptDetails;
  let promptText = "";
  let instructions: CreateInstructionParams[] = [];
  let knowledgebase: CreateKnowledgeBaseParams[] = [];
  let isSaving = false;

  let dlgEl: HTMLDialogElement;

  const unsubscribe = storePromptId.subscribe((value) => {
    if (value) {
      selectedPromptId = value;
      getPromptDetail(value);
    }
  });
  onDestroy(unsubscribe);

  async function getPromptDetail(id: string) {
    const response = await fetch(`/api/prompts.json?_id=${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      promptDetails = (await response.json()) as PromptDetails;
      promptText = promptDetails.prompt;
      instructions = promptDetails.instructions;
      knowledgebase = promptDetails.knowledgebase;
    } else {
      console.error("API call failed");
    }
  }

  async function savePromptGlobal() {
    isSaving = true;
    const response = await fetch(`/api/prompts/${selectedPromptId}.json`, {
      method: "PUT",
      body: JSON.stringify(promptDetails),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    alert(data.message);
    if (response.ok) {
      promptText = promptDetails.prompt;
      instructions = promptDetails.instructions;
      knowledgebase = promptDetails.knowledgebase;
      isSaving = false;
    }
  }
</script>

{#if promptDetails}
  <div class="mx-auto">
    <button
      class="btn btn-sm btn-neutral btn-2 border-0 bg-neutral-content text-neutral hover:text-neutral-content mb-4"
      on:click={() => dlgEl.showModal()}
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

    {#if promptText}
      <h2 class="pb-2">Prompt</h2>
      <div class="card border-2 border-base-300 border-2 bg-base-100 p-4 mb-4">
        <div>
          <p class="line-clamp-5">
            {promptText}
          </p>
        </div>
      </div>
    {/if}

    {#if instructions}
      <h2 class="pb-2">Instruction</h2>
      {#each instructions as instruction}
        <div
          class="card border-2 border-base-300 border-2 bg-base-100 p-4 mb-4"
        >
          <div>
            <p class="line-clamp-5">
              {instruction.instruction}
            </p>
          </div>
        </div>
      {/each}
    {/if}

    {#if knowledgebase}
      <h2 class="pb-2">Knowledge base</h2>
      {#each knowledgebase as knowledgebase}
        <div
          class="card border-2 border-base-300 border-2 bg-base-100 p-4 mb-4"
        >
          <div>
            <p class="line-clamp-5">
              {knowledgebase.knowledge_base}
            </p>
          </div>
        </div>
      {/each}
    {/if}
  </div>
{/if}

<dialog class="modal" bind:this={dlgEl}>
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
        checked={true}
      />
      {#if promptDetails}
        <div
          role="tabpanel"
          class="tab-content bg-base-100 border-base-300 rounded-box p-6"
        >
          <InputArea
            placeholder="Edit your prompt here..."
            bind:promptText={promptDetails.prompt}
          />
        </div>
      {/if}
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
        {#if promptDetails}
          {#each promptDetails.instructions as instruction}
            <InputArea
              bind:promptText={instruction.instruction}
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
        {#if promptDetails}
          {#each promptDetails.knowledgebase as kb}
            <InputArea
              bind:promptText={kb.knowledge_base}
              placeholder="Edit your instruction here..."
            />
          {/each}
        {/if}
      </div>
    </div>
    <!--
    <div class="modal-action">
      <form method="dialog">
        <button
          class="btn btn-lg btn-primary font-normal"
          class:btn-disable={isSaving}
          on:click|preventDefault={savePromptGlobal}
        >
          {#if isSaving}
            <span class="loading loading-spinner"></span>
            {t("prompt-library.add.prompts.saving")}
          {:else}
            {t("prompt-execution.showGlobal")}
          {/if}
        </button>
      </form>
    </div>
    -->
  </div>
</dialog>
