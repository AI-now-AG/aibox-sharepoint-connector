<script lang="ts">
  import { onMount } from "svelte";
  import { tenant } from "$stores";
  import { EventName } from "$types/Posthog";
  import { posthogClientCapture } from "$utils/posthogClient";

  interface Props {}
  let {}: Props = $props();

  onMount(async function () {
    posthogClientCapture($tenant, EventName.AiboxTriggerSurvey, {
      trigger_by: "Mount Posthog Event Trigger",
    });
  });
</script>
