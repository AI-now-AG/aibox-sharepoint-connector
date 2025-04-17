<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  const t = useTranslations();

  function handleNext() {
    // TODO: Handle validate before go to next step
    window.location.href = "/subscription/step3";
  }
</script>

<div class="max-w-5xl mx-auto">
  <h1 class="font-sanns text-3xl font-bold text-black mt-2">
    Provide your billing information
  </h1>
  <p class="font-sans text-base font-medium text-gray-600 mt-6 mb-10">
    We need this information to send you the invoice
  </p>

  <div class="fixed bottom-4 right-10 w-[33.3%] flex items-center justify-end">
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
