<script lang="ts">
  import transcriptStore from "$stores/transcript";
  import type { TranscriptionType } from "$types/TranscribeRequest";
  import { onMount } from "svelte";

  interface Props {
    usecaseId?: string;
    transcriptionType?: TranscriptionType;
    isSelected?: boolean;
  }

  let {
    usecaseId = $bindable(""),
    transcriptionType,
    isSelected,
  }: Props = $props();

  let loading = $state(false);

  onMount(async () => {
    transcriptStore.subscribe((value) => {
      const entry = value.find((entry) =>
        usecaseId
          ? entry.usecaseId === usecaseId
          : entry.type === transcriptionType,
      );
      if (entry) {
        let options = entry.options;
        if (
          options.txtOuput ||
          options.txtUrl ||
          options.srtUrl ||
          options.assUrl ||
          options.jsonUrl ||
          options.zipFile
        ) {
          loading = false;
        } else {
          loading = true;
        }
      }
    });
  });
</script>

{#if loading}
  <span
    class={`loading loading-dots loading-sm ${isSelected ? "text-base-100" : "text-primary"}`}
  ></span>
{/if}
