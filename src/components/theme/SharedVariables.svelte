<script lang="ts">
  import { setLanguage } from "$i18n/utils";
  import { user as userStore, tenant as tenantStore } from "$stores";

  interface Props {
    tenant?: any;
    user?: any;
    locale: string;
  }

  let { tenant, user, locale }: Props = $props();

  // update global stores
  if (user) {
    $userStore = user;
  }
  if (tenant) {
    $tenantStore = tenant;
  }

  // share language for all components
  setLanguage(locale);
</script>
