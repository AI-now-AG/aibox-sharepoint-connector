<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import { isOnboarding } from "$stores";

  const t = useTranslations();
  let loading = $state(false);

  interface Props {
    user: any;
  }
  let { user } = $props() as Props;

  let isShow = $state(false);
  let currentUrl = $state("javascript:void(0)");

  const handleClick = async (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.tagName === "A" && target.dataset.verified === "true") {
      event.preventDefault();

      try {
        loading = true;
        const result = await actions.auth.emailVerification({});
        if (result?.data?.success) {
          addToast({
            type: "success",
            message: t("user.send-verify-email-success"),
          });
        }
      } catch {
        addToast({
          type: "error",
          message: t("user.send-verify-email-failed"),
        });
      } finally {
        loading = false;
      }
    }
  };

  onMount(() => {
    currentUrl = "#verification";
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("click", handleClick);
    };
  });

  $effect(() => {
    if (!$isOnboarding) {
      setTimeout(async () => {
        try {
          const result = await actions.user.get({ _id: user.id });
          if (result.data && !result.data.email_verified) {
            isShow = true;
            console.log("show email verification message");
          }
        } catch (error) {
          console.log("error", error);
        }
      }, 6000);
    }
  });
</script>

{#if isShow}
  <div
    class="fixed bottom-20 right-4 bg-warning text-sm text-warning-content max-w-lg p-2 pl-4 pr-4 rounded-md shadow-lg"
  >
    {@html t("user.unverified-email-message", {
      url: currentUrl,
    })}
  </div>

  <Loading show={loading} />
{/if}
