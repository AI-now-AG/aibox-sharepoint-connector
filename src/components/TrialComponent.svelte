<script lang="ts">
  import { onMount } from "svelte";

  import { useTranslations } from "$i18n/utils";
  import { isOnboarding } from "$stores";

  const t = useTranslations();

  onMount(async () => {});
</script>

{#if !$isOnboarding}
  <div
    class="fixed bottom-4 right-4 bg-green-300 text-sm text-gray-800 max-w-lg p-2 pl-4 pr-4 rounded-md shadow-lg"
  >
    {@html t("tenant.trial-message")}
  </div>
{/if}
