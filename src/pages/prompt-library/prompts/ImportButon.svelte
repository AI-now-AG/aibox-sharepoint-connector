<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  import ImportFileUpload from "./ImportFileUpload.svelte";

  const t = useTranslations();

  let fileUploadModal: HTMLDialogElement;
  let inputFiles: File[] = [];
</script>

<div>
  <button
    class="btn btn-default btn-outline font-normal grow-0"
    on:click|preventDefault={() => {
      console.log('aaaa');
      fileUploadModal.showModal();
    }}
  >
    {@html svgIcons.fileImport}
    import
  </button>

  <ImportFileUpload
    bind:modal={fileUploadModal}
    bind:files={inputFiles}
  />
</div>