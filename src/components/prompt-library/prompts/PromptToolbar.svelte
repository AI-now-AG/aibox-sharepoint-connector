<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { preventDefault } from "$utils/common";
  import ImportExport from "./ImportExport.svelte";
  import AddPromptDialog from "$components/prompt-library/prompts/AddPromptDialog.svelte";
  import { useTranslations } from "$i18n/utils";

  interface Props {
    isEditable?: boolean;
    showImportExport?: boolean;
  }

  let { showImportExport = true, isEditable = false }: Props = $props();

  const t = useTranslations();

  let addPromptDialog: HTMLDialogElement | undefined = $state();

  function addPrompt() {
    // Use show() instead of showModal() to allow toast visibility
    addPromptDialog?.show();
  }
</script>

<div class="flex gap-2">
  {#if showImportExport}
    <ImportExport />
  {/if}

  <button
    class="btn btn-outline font-normal grow-0"
    onclick={preventDefault(addPrompt)}
  >
    {@html svgIcons.add}
    {t("prompt-library.prompts.add")}
  </button>
</div>

<AddPromptDialog bind:addPromptDialog {isEditable} />
