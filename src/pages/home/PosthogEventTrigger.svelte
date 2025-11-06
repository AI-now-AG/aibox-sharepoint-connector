<script lang="ts">
  import { onMount } from "svelte";
  import { tenant } from "$stores";
  import posthogClient from "$utils/posthogClient";
  import { EventName } from "$types/Posthog";

  interface Props {}
  let {}: Props = $props();

  onMount(async function () {
    // TODO: Handle logic check tenant specific here
    // Could be use configuration from Supper Admin to control which tenant will be effected
    posthogClient.capture(EventName.AiboxTriggerSurvey, {
      tenant_id: $tenant?._id?.toString(),
    });
    console.log("posthogClient.capture(EventName.AiboxTriggerSurvey)");
  });
</script>
