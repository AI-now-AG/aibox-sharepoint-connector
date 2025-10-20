<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { preventDefault } from "$utils/common";
  import AddPromptDialog from "$components/prompt-interface/AddPromptDialog.svelte";
  import { useTranslations } from "$i18n/utils";

  interface Props {
    title: string;
    currentCategoryId: string;
    currentGroupId: string;
    isEditable?: boolean;
  }

  let {
    title,
    currentCategoryId,
    currentGroupId,
    isEditable = false,
  }: Props = $props();

  let addPromptDialog: HTMLDialogElement | undefined = $state();

  const t = useTranslations();

  function addPrompt() {
    // Use show() instead of showModal() to allow toast visibility
    addPromptDialog?.show();
  }
</script>

<div
  class="grid grid-cols-1 lg:grid-cols-2 gap-4 justify-between items-center py-2 lg:pt-8"
>
  <h1 class="text-4xl font-bold">
    {title}
  </h1>
  <div class="text-left lg:text-right">
    {#if isEditable}
      <button
        class="btn btn-sm btn-outline font-normal grow-0"
        onclick={preventDefault(addPrompt)}
      >
        {@html svgIcons.add}
        {t("prompt-library.prompts.add")}
      </button>
    {/if}
  </div>
</div>

<AddPromptDialog
  bind:addPromptDialog
  {currentCategoryId}
  {currentGroupId}
  {isEditable}
/>
