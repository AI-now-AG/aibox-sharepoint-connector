<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  import Loading from "$components/Loading.svelte";
  import ImportUploadDialog from "./ImportUploadDialog.svelte";
  import { loading } from "$stores";

  const t = useTranslations();

  let fileUploadModal: HTMLDialogElement;
  let inputFile: File;

  const importUrl: string = "/prompts/export";
  const exportUrl: string = "/prompts/export";

  function handleImport() {
    console.log("file", inputFile);
  }

  function downloadExport() {
    $loading = true;
    fetch(exportUrl)
      .then((response) => {
        const blob = response.blob();
        const blobUrl = URL.createObjectURL(
          new Blob([blob], { type: "text/csv;charset=utf-8" }),
        );

        const disposition = response.headers.get("Content-Disposition");
        const parts = disposition?.split(";");
        const fileName = parts[1].replace(/['"]/g, "").split("=")[1];

        const link = document.createElement("a");
        link.href = blobUrl;
        link.target = "_blank";
        link.download = fileName;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

        $loading = false;
      })
      .catch((error) => {
        console.error("Error downloading file:", error);
        $loading = false;
      });
  }
</script>

<div class="space-x-2">
  <button
    class="btn btn-default btn-outline font-normal grow-0"
    on:click={() => {
      fileUploadModal.showModal();
    }}
  >
    {@html svgIcons.fileImport}
    {t("prompt-library.prompts.import")}
  </button>
  <button
    class="btn btn-default btn-outline font-normal grow-0"
    data-astro-prefetch="false"
    on:click={downloadExport}
  >
    {@html svgIcons.fileExport}
    {t("prompt-library.prompts.export")}
  </button>
</div>

<ImportUploadDialog
  bind:modal={fileUploadModal}
  bind:file={inputFile}
  on:upload={handleImport}
/>

<Loading bind:show={$loading} />
