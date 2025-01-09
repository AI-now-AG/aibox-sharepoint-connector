<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import { useTranslations } from "$i18n/utils";
  import { tenant } from "$stores";
  import { addToast } from "$stores/toast";
  import { svgIcons } from "$assets/icons";
  import { type TranscriptionCard } from "$types/TranscriptionCard";
  const t = useTranslations();

  let instructionTitle = "";
  let instructionText = "";
  let isMounted = false;

  onMount(() => {
    isMounted = true;
  });

  export let transcriptionCard: TranscriptionCard | undefined = undefined;
  export let isEditable: boolean = false;

  $: if (transcriptionCard) {
    instructionTitle = transcriptionCard.title || "";
  }

  $: if (transcriptionCard && !isMounted) {
    instructionText = transcriptionCard.description || "";
  }

  let isSaving = false;
  $: isFormValid =
    instructionTitle.trim() !== "" && instructionText.trim() !== "";

  async function saveInstruction() {
    isSaving = true;

    const transcriptionUpdate: any = {
      _id: $tenant!._id.toString(),
      transcriptions: {} as Record<string, any>,
    };

    // Map transcription types to their corresponding properties
    const transcriptionFields: Record<string, { field: string; text: string }> =
      {
        plaintext: { field: "plaintext", text: instructionText },
        subtitles: { field: "subtitles", text: instructionText },
        summary: { field: "summary", text: instructionText },
      };

    // Check if transcriptionCard type exists in the map
    if (transcriptionCard && transcriptionFields[transcriptionCard.type]) {
      const { field, text } = transcriptionFields[transcriptionCard.type];
      transcriptionUpdate.transcriptions[field] = {
        enabled: transcriptionCard?.toggle ?? false,
        text,
      };
    }

    const { error } =
      await actions.transcription_settings.update(transcriptionUpdate);
    isSaving = false;

    if (error) {
      addToast({
        message: error.message,
        type: "error",
      });
    } else {
      addToast({
        message: "Updated",
        type: "success",
      });
    }
  }

  function goback() {
    window.history.back();
  }
</script>

<div class="container max-w-5xl p-6 mx-auto p-4">
  <div class="w-full min-w-xs pt-2 lg:pt-6">
    <div class="flex items-center pt-2 pb-6">
      <button class="mr-4" on:click={goback}>
        {@html svgIcons.back}
      </button>
      <h1 class="text-4xl font-bold">
        {t("prompt-library.instructions.edit")}
      </h1>
    </div>
    <form class="rounded pt-6 mb-4 space-y-6">
      <div class="grid grid-cols-1 gap-4 justify-center">
        <div>
          <p class="mb-2">{t("prompt-library.add.knowledgebase.title")}*</p>
          <label class="input input-bordered flex items-center gap-2">
            <input
              type="text"
              class="grow"
              bind:value={instructionTitle}
              placeholder="title"
            />
            {@html svgIcons.Lock}
          </label>
        </div>
      </div>

      <div class="mb-4">
        <p class="mb-2">{t("prompt-library.add.knowledgebase.text")}*</p>
        <textarea
          bind:value={instructionText}
          placeholder="e.g. type knowledge base details..."
          class="input input-bordered min-w-xs shadow appearance-none min-h-96 w-full py-2 px-3"
        />
      </div>

      {#if isEditable}
        <div class="flex items-center justify-between">
          <button
            class={`btn btn-active btn-primary px-8 font-normal ${(!isFormValid || isSaving) && "btn-disabled"}`}
            on:click|preventDefault={saveInstruction}
          >
            {#if isSaving}
              <span class="loading loading-spinner"></span>
              {t("prompt-library.add.prompts.saving")}
            {:else}
              {t("prompt-library.add.knowledgebase.save")}
            {/if}
          </button>
        </div>
      {/if}
    </form>
  </div>
</div>
