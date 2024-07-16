<script>
  import BasicPrompt from "$components/PromptInput.svelte";
  import { onMount } from "svelte";

  let prompt;
  let instructions;

  onMount(async function () {
    const response = await fetch("/api/headlines.json?prompt=true");
    const data = await response.json();

    if (data.prompt && data.instructions) {
      prompt = data.prompt;
      instructions = data.instructions;
    }
  });
</script>

<dialog id="configuration_dialog" class="modal">
  <div class="modal-box w-8/12 max-w-5xl">
    <h3 class="text-lg font-bold">Configuration</h3>
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
        <BasicPrompt
          placeholder="Edit your prompt here..."
          bind:promptText={prompt}
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
        <BasicPrompt
          bind:promptText={instructions}
          placeholder="Edit your instruction here..."
        />
      </div>
    </div>
    <div class="modal-action">
      <form method="dialog">
        <button class="btn" type="submit">Apply</button>
      </form>
    </div>
  </div>
</dialog>
