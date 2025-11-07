<script lang="ts">
  import { onMount } from "svelte";
  import { tenant } from "$stores";
  import { EventName } from "$types/Posthog";
  import { posthogClientCapture } from "$utils/posthogClient";

  interface Props {}
  let {}: Props = $props();

  onMount(async function () {
    // TODO: Handle logic check tenant specific here
    // Could be use configuration from Supper Admin to control which tenant will be effected
    console.log("posthogClient.capture(EventName.AiboxTriggerSurvey) onMount");
    posthogClientCapture($tenant, EventName.AiboxTriggerSurvey, {
      tenant_id: $tenant?._id?.toString() || "-",
      trigger_by: "Mount Posthog Event Trigger",
    });
  });
</script>
