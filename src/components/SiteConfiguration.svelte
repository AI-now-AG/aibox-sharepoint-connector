<script>
  import { onMount } from "svelte";
  import { getLanguage } from "$i18n/utils";
  import { defaultLang } from "$i18n/ui";
  import { locale as storeLocale } from "$stores/locale";

  // Assuming `tenant` is passed as a prop or retrieved from a store
  export let tenant;
  export let locale;

  const theme = tenant?.theme;
  const tenantLanguage = tenant?.default_language || defaultLang;
  const language = getLanguage(tenantLanguage);
  storeLocale.set(locale);

  const primaryColor = "rgb(24 121 78)";
  console.log("primaryColor", { primaryColor });

  onMount(() => {
    // set default theme in storage
    const savedTheme = localStorage.getItem("theme");
    if (theme && !savedTheme) {
      localStorage.setItem("theme", theme);
    }
  });
</script>

<style>
  :root,
  [data-theme] {
    --bc: var(--primaryColor);
  }
</style>
