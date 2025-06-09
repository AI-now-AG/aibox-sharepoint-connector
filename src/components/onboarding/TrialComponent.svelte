<script lang="ts">
  import { setLanguage } from "$i18n/utils";
  import { useTranslations } from "$i18n/utils";
  import { isOnboarding } from "$stores";
  import { resetTrialBanner } from "$stores/bannerReset";
  import { onMount } from "svelte";

  interface Props {
    locale: string;
  }

  let { locale }: Props = $props();
  let isShow = $state(false);
  let isClosed = $state(false);

  // set language
  setLanguage(locale);

  const t = useTranslations();

  $effect(() => {
    isShow = !$isOnboarding;
  });

  onMount(() => {
    resetTrialBanner.subscribe((val) => {
      if (val) {
        resetOnRouteChange();
        resetTrialBanner.set(false);
      }
    });
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
</script>

{#if isShow && !isClosed}
  <div
    class="fixed bottom-4 right-4 bg-info text-sm text-info-content max-w-lg p-2 pl-4 pr-4 rounded-md shadow-lg z-50 flex items-center"
  >
    <div class="flex-1">
      {@html t("tenant.trial-message")}
    </div>
    <button
      class="ml-2 btn btn-xs btn-circle btn-ghost"
      aria-label="Close"
      onclick={() => (isClosed = true)}
      style="line-height: 1;">✕</button
    >
  </div>
{/if}
