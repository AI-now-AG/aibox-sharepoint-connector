<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  import Loading from "$components/Loading.svelte";
  import ImportUploadDialog from "./ImportUploadDialog.svelte";
  import { loading } from "$stores";

  const t = useTranslations();

  let fileUploadModal: HTMLDialogElement;
  let inputFile: File;

  const importUrl: string = "/prompts/import";
  const exportUrl: string = "/prompts/export";

  function startImport() {
    console.log("file", inputFile);

    const data = new FormData();
    data.append("file", inputFile);

    $loading = true;
    fetch(importUrl, {
      method: "POST",
      body: data,
    })
      .then((response) => {
        // start import process

        // ensure the upload dialog is closed if it is currently open
        if (fileUploadModal.open) {
          fileUploadModal.close();
        }

        $loading = false;
      })
      .catch((error) => {
        console.error("Error import file:", error);
        $loading = false;
      });
  }

  function downloadExport() {
    $loading = true;
    fetch(exportUrl)
      .then(async (response) => {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(
          new Blob([blob], { type: "text/csv;charset=utf-8" }),
        );

        const disposition = response.headers.get("Content-Disposition");
        const parts = disposition?.split(";");
        const fileName = parts[1].replace(/['"]/g, "").split("=")[1];

        console.log("fileName", { disposition, parts, fileName });

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
  on:confirm={startImport}
/>

<Loading bind:show={$loading} />
