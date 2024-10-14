<script>
  import { setLanguage } from "$i18n/utils";
  import { user as userStore, tenant as tenantStore } from "$stores";

  export let tenant;
  export let user;
  export let locale;

  // update global stores
  userStore.set(user);
  tenantStore.set(tenant);

  // share language for all components
  setLanguage(locale);
</script>
