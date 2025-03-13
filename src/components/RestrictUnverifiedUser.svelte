<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import { loading, showLoading, hideLoading } from "$stores";

  const t = useTranslations();

  interface Props {
    user: any;
  }
  let { user } = $props() as Props;

  let currentUrl = $state("javascript:void(0)");

  const handleClick = async (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.tagName === "A" && target.dataset.verified === "true") {
      event.preventDefault();
      if (!user.email_verified) {
        try {
          showLoading();
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
          hideLoading();
        }
      }
    }
  };

  onMount(() => {
    currentUrl = window.location.href;
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  });
</script>

<div
  class="fixed bottom-16 right-4 bg-warning text-sm text-gray-800 max-w-lg p-2 pl-4 pr-4 rounded-md shadow-lg"
>
  {@html t("user.unverified-email-message", {
    url: currentUrl,
  })}
</div>

<Loading bind:show={$loading} />
