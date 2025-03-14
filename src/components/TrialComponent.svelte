<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { isOnboarding } from "$stores";

  const t = useTranslations();

  let isShow = $state(false);

  $effect(() => {
    isShow = !$isOnboarding;
  });
</script>

{#if isShow}
  <div
    class="fixed bottom-4 right-4 bg-green-300 text-sm text-base-content max-w-lg p-2 pl-4 pr-4 rounded-md shadow-lg"
  >
    {@html t("tenant.trial-message")}
  </div>
{/if}
