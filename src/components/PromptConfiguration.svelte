<script>
  import InputArea from "$components/InputArea.svelte";
  
  export let promptStore;
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
        <InputArea
          placeholder="Edit your prompt here..."
          bind:promptText={promptStore.prompt}
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
        <InputArea
          bind:promptText={promptStore.instruction}
          placeholder="Edit your instruction here..."
        />
      </div>
    </div>
    <div class="modal-action">
      <form method="dialog">
        <button class="btn" type='submit'>Apply</button>
      </form>
    </div>
  </div>
</dialog>
