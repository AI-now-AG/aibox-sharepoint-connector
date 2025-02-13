<script lang="ts">
  import { actions } from "astro:actions";
  import { useTranslations } from "$i18n/utils";
  import { tenant } from "$stores";
  import { addToast } from "$stores/toast";
  import { svgIcons } from "$assets/icons";
  import { type TranscriptionCard } from "$types/TranscriptionCard";
  const t = useTranslations();

  let instructionTitle = $state("");
  let instructionText = $state("");

  interface Props {
    transcriptionCard?: TranscriptionCard | undefined;
    isEditable?: boolean;
  }

  let { transcriptionCard = $bindable(), isEditable = false }: Props = $props();

  $effect(() => {
    if (transcriptionCard) {
      instructionTitle = transcriptionCard.title || "";
      instructionText = transcriptionCard.description || "";
    }
  });

  let isSaving = $state(false);
  let isFormValid = $derived(
    instructionTitle.trim() !== "" && instructionText.trim() !== "",
  );

  function preventDefault(fn) {
    return function (event) {
      event.preventDefault();
      fn.call(this, event);
    };
  }

  async function saveInstruction() {
    isSaving = true;

    const transcriptionUpdate = {
      _id: $tenant!._id.toString(),
      transcriptions: {
        [transcriptionCard?.type]: {
          enabled: transcriptionCard?.toggle ?? false,
          text: instructionText,
        },
      },
    };

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

<div
  class="container max-w-5xl mx-auto p-6 grid grid-cols-3 md:grid-cols-[1fr_max-content] gap-8"
>
  <div class="w-full min-w-xs pt-2 lg:pt-6">
    <div class="flex items-center pt-2 pb-6">
      <button class="mr-4" onclick={goback}>
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
        ></textarea>
      </div>

      {#if isEditable}
        <div class="flex items-center justify-between">
          <button
            class={`btn btn-active btn-primary px-8 font-normal ${(!isFormValid || isSaving) && "btn-disabled"}`}
            onclick={preventDefault(saveInstruction)}
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
