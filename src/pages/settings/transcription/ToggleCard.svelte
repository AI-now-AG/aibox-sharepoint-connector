<script lang="ts">
  import { actions } from "astro:actions";
  import { useTranslations } from "$i18n/utils";
  import { tenant } from "$stores";
  import { addToast } from "$stores/toast";
  import { svgIcons } from "$assets/icons";
  import { type TranscriptionCard } from "$types/TranscriptionCard";
  import { AudioCategory } from "$types/TenantFeature";
  const t = useTranslations();

  let instructionTitle = $state("");

  interface Props {
    transcriptionCard: TranscriptionCard;
  }

  let { transcriptionCard = $bindable() }: Props = $props();

  $effect(() => {
    if (transcriptionCard) {
      instructionTitle = transcriptionCard.title || "";
    }
  });

  let isSaving = $state(false);

  const updateTranscriptionSetting = async (enabled: boolean) => {
    isSaving = true;

    const transcriptionUpdate = {
      _id: $tenant!._id.toString(),
      audioCategory: transcriptionCard.category,
      enabled: enabled,
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
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };
</script>

<div class="card-body space-y-2 justify-between">
  <div>
    <div class="flex justify-between items-center mb-4 gap-2">
      <h2 class="font-semibold text-lg">{transcriptionCard.title}</h2>
      <!-- {#if isSaving}
        <span class="loading loading-dots loading-md"></span>
      {:else}

          <input
            type="checkbox"
            class="toggle toggle-primary"
            bind:checked={transcriptionCard.toggle}
            onchange={(event) =>
              updateTranscriptionSetting(
                (event.target as HTMLInputElement)?.checked,
              )}
          />
        
      {/if} -->
    </div>
  </div>
  {#if !transcriptionCard.category.includes(AudioCategory.AudioPro)}
    <div
      class="card-actions"
      aria-disabled={!transcriptionCard.toggle}
      class:opacity-50={!transcriptionCard.toggle}
      class:pointer-events-none={!transcriptionCard.toggle}
    >
      <a
        href={`/settings/transcription/update?type=${encodeURIComponent(transcriptionCard.type)}`}
        class="btn btn-primary"
      >
        edit
      </a>
    </div>
  {/if}
</div>
