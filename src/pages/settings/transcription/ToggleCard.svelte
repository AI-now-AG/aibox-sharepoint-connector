<script lang="ts">
  import { useTranslations } from "$i18n/utils";
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
</script>

<div class="card-body space-y-2 justify-between">
  <div>
    <div class="flex justify-between items-center mb-4 gap-2">
      <h2 class="font-semibold text-lg">{transcriptionCard.title}</h2>
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
