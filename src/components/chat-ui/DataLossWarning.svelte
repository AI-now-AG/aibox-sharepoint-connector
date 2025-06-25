<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";

  const t = useTranslations();
</script>

<div class="container p-3 gap-2 items-center flex justify-center">
  {@html svgIcons.warningIcon}
  <p class="text-xs text-neutral">
    {t("prompt-execution.historyRemove.info")}
  </p>
</div>
