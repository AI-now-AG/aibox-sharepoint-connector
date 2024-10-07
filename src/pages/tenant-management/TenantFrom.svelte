<script>
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { getLocale } from "$stores/locale";

  export let tenant

  const t = useTranslations(getLocale());
</script>

<div class="container max-w-full mx-auto p-6" style="font-family: Inter;">
    {JSON.stringify(tenant)}
</div>

<style>
</style>
