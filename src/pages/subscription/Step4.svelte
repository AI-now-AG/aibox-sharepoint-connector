<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  const t = useTranslations();

  function handleNext() {
    // TODO: Handle validate before go to next step
    window.location.href = "/subscription/complete";
  }
</script>

<div class="max-w-5xl mx-auto">
  <div class="w-full flex items-center justify-end rounded-lg p-4">
    <button
      class="btn btn-active btn-primary min-w-[144px]"
      onclick={() => {
        handleNext();
      }}
    >
      {t("common.next")}
    </button>
  </div>
</div>
