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
    {t("tenant.this-is-free-trial-version")}
    <a href="/" target="_blank" class="font-normal text-blue-600 hover:underline">
      {t("tenant.contact-us")}</a
    >
    {t("tenant.to-upgrade")}.
  </div>
{/if}
