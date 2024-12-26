<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";

  const t = useTranslations();
</script>

<a
  href="/prompts/export"
  class="btn btn-default btn-outline font-normal grow-0"
  data-astro-prefetch="false"
>
  {@html svgIcons.fileExport}
  export
</a>