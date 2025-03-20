<script lang="ts">
  import { setLanguage } from "$i18n/utils";
  import { user as userStore, tenant as tenantStore } from "$stores";

  let { tenant, user, locale } = $props();

  // update global stores
  $userStore = user;
  $tenantStore = tenant;

  // share language for all components
  setLanguage(locale);
</script>
