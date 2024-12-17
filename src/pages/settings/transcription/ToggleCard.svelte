<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import { useTranslations } from "$i18n/utils";
  import { tenant } from "$stores";
  import { addToast } from "$stores/toast";
  import { svgIcons } from "$assets/icons";
  import { type TranscriptionCard } from "$utils/TranscriptionCard";
  const t = useTranslations();

  let instructionTitle = "";
  let instructionText = "";
  let isMounted = false;

  onMount(() => {
    isMounted = true;
  });

  export let transcriptionCard: TranscriptionCard | undefined = undefined;

  $: if (transcriptionCard) {
    instructionTitle = transcriptionCard.title || "";
  }

  $: if (transcriptionCard && !isMounted) {
    instructionText = transcriptionCard.description || "";
  }

  let isSaving = false;
  $: isFormValid =
    instructionTitle.trim() !== "" && instructionText.trim() !== "";

  const updateTranscriptionSetting = async (enabled: boolean) => {
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
        largefile: { field: "largefile", text: instructionText },
      };
      
    // Check if transcriptionCard type exists in the map
    if (transcriptionCard && transcriptionFields[transcriptionCard.type]) {
      const { field, text } = transcriptionFields[transcriptionCard.type];
      transcriptionUpdate.transcriptions[field] = {
        enabled: enabled,
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
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };
</script>

<div class="card-body space-y-2 justify-between">
  <div>
    <div class="flex justify-between items-center mb-4">
      <!-- <span class="badge badge-outline">{transcriptionCard.title}</span> -->
      <h2 class="font-semibold text-lg">{transcriptionCard.title}</h2>
      {#if isSaving}
        <span class="loading loading-dots loading-md"></span>
      {:else}
        <label class="swap swap-rotate">
          <input
            type="checkbox"
            class="toggle toggle-primary"
            bind:checked={transcriptionCard.toggle}
            on:change={(event) =>
              updateTranscriptionSetting(event.target.checked)}
          />
        </label>
      {/if}
    </div>
    <div class="flex flex-col gap-8">
      <p class="text-base-content/60 line-clamp-2">
        {transcriptionCard.description}
      </p>
    </div>
  </div>
  <div class="card-actions">
    <a
      href={`/settings/transcription/update?type=${encodeURIComponent(transcriptionCard.type)}`}
      class="btn btn-primary"
    >
      edit
    </a>
  </div>
</div>
