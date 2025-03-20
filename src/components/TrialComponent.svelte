<script lang="ts">
  import { setLanguage } from "$i18n/utils";
  import { useTranslations } from "$i18n/utils";
  import { isOnboarding } from "$stores";

  interface Props {
    locale: string;
  }

  let { locale }: Props = $props();
  let isShow = $state(false);

  const t = useTranslations();

  $effect(() => {
    isShow = !$isOnboarding;
  });

  // set language
  setLanguage(locale);
</script>

{#if isShow}
  <div
    class="fixed bottom-4 right-4 bg-info text-sm text-info-content max-w-lg p-2 pl-4 pr-4 rounded-md shadow-lg"
  >
    {@html t("tenant.trial-message")}
  </div>
{/if}
