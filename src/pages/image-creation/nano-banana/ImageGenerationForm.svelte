<script lang="ts">
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();
</script>

<div class="grid grid-cols-1 grid-rows-[1fr_min-content] space-y-6 h-full">
  <div class="flex flex-col space-y-6">
    <h1 class="pt-2 mb-2 lg:pt-8 text-4xl font-bold">
      {t("create-image.create-nano-banana-image-title")}
    </h1>
    <p class="m-0">{t("create-image.create-nano-banana-image-description")}</p>

    <!-- UI components -->
  </div>
</div>
