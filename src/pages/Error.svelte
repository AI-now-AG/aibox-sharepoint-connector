<script lang="ts">
  import { onMount } from "svelte";
  import { getLanguageData, setLanguage, useTranslations } from "$i18n/utils";

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
  let backToHomText = $state(t("common.back-to-home"));

  onMount(() => {
    let browserLanguage = navigator.language || navigator.languages[0];
    console.log("browserLanguage", browserLanguage);
    const translate = getLanguageData(browserLanguage);

    if (errorCode) {
      switch (errorCode) {
        case "422":
          errorTitle = translate["existing-email.error-title"];
          errorDescription = translate["existing-email.error-description"];
          logoutText = translate["common.logout"];
          refreshText = translate["common.refresh"];
          backToHomText = translate["common.back-to-home"];
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
    class="container flex flex-col items-center justify-center px-5 mx-auto my-8 bg-gray-800 bg-opacity-50 rounded-xl shadow-xl p-8 border border-gray-700"
  >
    <div class="text-center">
      {#if !errorTitle}
        <div class="mb-6">
          <span class="fas fa-exclamation-circle text-6xl text-red-500"></span>
        </div>
        <h1
          class="mb-6 text-4xl md:text-5xl font-bold text-white tracking-tight"
        >
          {errorTitle}
        </h1>
        <p class="mb-8 text-lg md:text-xl text-gray-300 mx-auto">
          {errorDescription}
        </p>
      {/if}

      {#if errorTitle || errorDescription}
        <div class="mb-6">
          <span class="fas fa-exclamation-circle text-6xl text-red-500"> </span>
        </div>
        <h1
          class="mb-6 text-4xl md:text-5xl font-bold text-white tracking-tight"
        >
          {errorTitle}
        </h1>
        <p class="mb-8 text-lg md:text-xl text-gray-300 mx-auto">
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
          {backToHomText}
        </a>
      {/if}
    </div>
  </div>
</section>
