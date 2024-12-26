<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  import ImportUploadDialog from "./ImportUploadDialog.svelte";

  const t = useTranslations();

  let fileUploadModal: HTMLDialogElement;
  let inputFile: File;

  function handleImport() {
    console.log("file", inputFile);
  }
</script>

<div class="space-x-2">
  <button
    class="btn btn-default btn-outline font-normal grow-0"
    on:click|preventDefault={() => {
      fileUploadModal.showModal();
    }}
  >
    {@html svgIcons.fileImport}
    {t("prompt-library.prompts.import")}
  </button>
  <a
    href="/prompts/export"
    class="btn btn-default btn-outline font-normal grow-0"
    data-astro-prefetch="false"
  >
    {@html svgIcons.fileExport}
    {t("prompt-library.prompts.export")}
  </a>
</div>

<ImportUploadDialog
  bind:modal={fileUploadModal}
  bind:file={inputFile}
  on:upload={handleImport}
/>
