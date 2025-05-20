<script lang="ts">
  import { onMount } from "svelte";
  import { getLanguageData, useTranslations } from "$i18n/utils";

  interface Props {
    errorCode?: string;
    errorTitle?: string;
    errorDescription?: string;
    params?: string;
  }
  let { errorCode, errorTitle, errorDescription, params } = $props() as Props;
  let errorParams: any = $state({});

  const t = useTranslations();
  let logoutText = $state(t("common.logout"));
  let refreshText = $state(t("common.refresh"));
  let backToHomeText = $state(t("common.back-to-home"));

  onMount(() => {
    let browserLanguage = navigator.language || navigator.languages[0];
    console.log("browserLanguage", browserLanguage);
    const translate = getLanguageData(browserLanguage);

    if (errorCode) {
      switch (errorCode) {
        case "422":
          errorTitle = translate["existing-email.error-title"];
          errorDescription = translate["existing-email.error-description"];
          break;
        default:
          break;
      }
    }
    if (params) {
      errorParams = JSON.parse(params);
      console.log(errorParams);
    }
  });

  $effect(() => {});
</script>

<section class="flex items-center h-full p-16">
  <div
    class="w-full max-w-4xl flex flex-col items-center justify-center px-5 mx-auto my-8 bg-base-300 bg-opacity-50 rounded-xl shadow-xl p-8 border border-base-300"
  >
    <div class="text-center">
      <div class="mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-16 mx-auto shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {#if errorTitle || errorDescription}
        <h1 class="mb-6 text-4xl md:text-4xl font-bold tracking-tight">
          {errorTitle}
        </h1>
        <p class="mb-8 text-lg md:text-xl mx-auto">
          {errorDescription}
        </p>
      {/if}

      {#if errorTitle && ["tenant_inactive"].includes(errorTitle)}
        <a
          data-astro-reload
          href="/api/logout"
          class="btn btn-outline btn-primary px-6 py-3 text-lg font-semibold rounded-lg shadow-lg hover:bg-primary-focus transition-all duration-300"
        >
          {logoutText}
        </a>
        <a
          data-astro-reload
          href="/"
          class="btn btn-primary ml-2 px-6 py-3 text-lg font-semibold rounded-lg shadow-lg hover:bg-primary-focus transition-all duration-300"
        >
          {refreshText}
        </a>
      {:else}
        <a
          rel="noopener noreferrer"
          href="/"
          class="btn btn-primary px-6 py-3 text-lg font-semibold rounded-lg shadow-lg hover:bg-primary-focus transition-all duration-300"
        >
          {backToHomeText}
        </a>
      {/if}
    </div>
  </div>
</section>
