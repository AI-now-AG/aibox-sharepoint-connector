<script>
  import { onMount } from "svelte";
  import { getLanguage, setLanguage } from "$i18n/utils";
  import { user as userStore, tenant as tenantStore } from "$stores";

  export let tenant;
  export let user;
  export let locale;

  // update stores
  userStore.set(user);
  tenantStore.set(tenant);

  // tenant settings
  const theme = tenant?.theme;
  const primaryColor = "rgb(24 121 78)";
  console.log("primaryColor", { primaryColor });

  // share language for all components
  setLanguage(locale);

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
