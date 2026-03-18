<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import { isOnboarding } from "$stores";
  import { resetUnverifiedBanner } from "$stores/bannerReset";

  const t = useTranslations();
  let loading = $state(false);

  interface Props {
    user: any;
  }
  let { user } = $props() as Props;

  let isShow = $state(false);
  let isClosed = $state(false);

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
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("click", handleClick);
    };
  });

  // Listen for route changes to reset isClosed
  function resetOnRouteChange() {
    isClosed = false;
  }

  // Patch pushState/replaceState to detect SPA navigation
  function patchHistoryMethod(type: "pushState" | "replaceState") {
    const orig = history[type];
    history[type] = function (...args) {
      const rv = orig.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
      return rv;
    };
  }

  if (typeof window !== "undefined") {
    patchHistoryMethod("pushState");
    patchHistoryMethod("replaceState");
    window.addEventListener("popstate", resetOnRouteChange);
    window.addEventListener("locationchange", resetOnRouteChange);
  }

  onMount(() => {
    resetUnverifiedBanner.subscribe((val) => {
      if (val) {
        resetOnRouteChange();
        resetUnverifiedBanner.set(false);
      }
    });
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

{#if isShow && !isClosed}
  <div
    class="fixed bottom-20 right-4 bg-warning text-sm text-warning-content max-w-lg p-2 pl-4 pr-4 rounded-md shadow-lg z-50 flex items-center"
  >
    <div class="flex-1">
      {@html t("user.unverified-email-message", {
        url: "#verification",
      })}
    </div>
    <button
      class="ml-2 btn btn-xs btn-circle btn-ghost leading-none"
      aria-label="Close"
      onclick={() => (isClosed = true)}>✕</button
    >
  </div>

  <Loading show={loading} />
{/if}
