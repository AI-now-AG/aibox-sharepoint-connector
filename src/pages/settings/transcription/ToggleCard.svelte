<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import { useTranslations } from "$i18n/utils";
  import { tenant } from "$stores";
  import { addToast } from "$stores/toast";
  import { svgIcons } from "$assets/icons";
  import { type TranscriptionCard } from "$types/TranscriptionCard";
  const t = useTranslations();

  let instructionTitle = $state("");
  let instructionText = $state("");
  let isMounted = $state(false);

  onMount(() => {
    isMounted = true;
  });

  interface Props {
    transcriptionCard: TranscriptionCard;
  }

  let { transcriptionCard = $bindable() }: Props = $props();

  $effect(() => {
    if (transcriptionCard) {
      instructionTitle = transcriptionCard.title || "";
    }
  });

  $effect(() => {
    if (transcriptionCard && !isMounted) {
      instructionText = transcriptionCard.description || "";
    }
  });

  let isSaving = $state(false);
  let isFormValid =
    $derived(instructionTitle.trim() !== "" && instructionText.trim() !== "");

  const updateTranscriptionSetting = async (enabled: boolean) => {
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
            onchange={(event) =>
              updateTranscriptionSetting(event.target?.checked)}
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
