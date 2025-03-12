<script lang="ts">
  import { onMount } from "svelte";

  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  interface Props {
    user: any;
  }
  let { user } = $props() as Props;

  onMount(async () => {});
</script>

{#if user && !user.email_verified}
  <div
    class="fixed bottom-16 right-4 bg-warning text-sm text-gray-800 max-w-lg p-2 pl-4 pr-4 rounded-md shadow-lg"
  >
    {@html t("user.unverified-email-message", {
      url: "/auth/email-verification",
    })}
  </div>
{/if}
