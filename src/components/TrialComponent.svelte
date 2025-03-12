<script lang="ts">
  import { onMount } from "svelte";

  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  interface Props {
    tenant: any;
  }
  let { tenant } = $props() as Props;

  onMount(async () => {});
</script>

{#if tenant?.is_trial}
  <div
    class="fixed bottom-4 right-4 bg-green-300 text-sm text-gray-800 p-2 pl-4 pr-4 rounded-md shadow-lg"
  >
    {@html t("tenant.trial-message")}
  </div>
{/if}
