<script lang="ts">
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { storePromptId } from "$components/prompt-interface/components/Stores";
  import EditPromptDetails from "$components/prompt-interface/components/EditPromptDetails.svelte";
  import ExecutionCardItem from "$components/prompt-interface/components/ExecutionCardItem.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import Loading from "$components/Loading.svelte";
  import { loading, showLoading, hideLoading } from "$stores";
  import log from "$utils/log";

  export let isEditable = false;
  export let cards: any;
  export let selectedPromptId;

  const t = useTranslations();

  const promptLimit = 5;
  let showMore = false;
  let selectedCardIndex: number = -1;
  let selectedEditPromptId: string = "";
  let selectedDeletePromptId: string = "";
  let dlgEl: HTMLDialogElement;
  let promptDialogMode: "update" | "clone" = "update";
  let confirmDeleteModal;

  // TODO: Remove below function once default prompt functionality implemented
  onMount(async function () {
    selectedCardIndex = 0;
    selectedPromptId = cards[0]._id;
    storePromptId.set(selectedPromptId);
    if (selectedEditPromptId) {
      dlgEl.showModal();
    }
  });

  function selectCard(index: number) {
    selectedCardIndex = index;
    selectedPromptId = cards[index]?._id ?? "";
    storePromptId.set(selectedPromptId);
  }

  async function editCard(index: number) {
    promptDialogMode = "update";
    selectedEditPromptId = cards[index]?._id ?? "";
    dlgEl.showModal();
  }

  async function duplicateCard(index: number) {
    promptDialogMode = "clone";
    selectedEditPromptId = cards[index]?._id ?? "";
    dlgEl.showModal();
  }

  function onDeleteCard(index: number) {
    selectedDeletePromptId = cards[index]?._id ?? "";
    confirmDeleteModal?.show();
  }

  async function deleteCard() {
    try {
      showLoading();
      const deletedPrompt: DeletePromptParams = {
        ...(selectedDeletePromptId && { _id: selectedDeletePromptId }),
      };
      log.d(deletedPrompt, "deletedPrompt");
      const response = await fetch("/api/prompts.json", {
        method: "DELETE",
        body: JSON.stringify(deletedPrompt),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || t("prompt-library.delete.prompt.failed"),
        );
      }
      const data = await response.json();
      addToast({
        message: data.message,
        type: "success",
      });
     
    } catch (error) {
      addToast({
        message:
          error instanceof Error ? error.message : t("common.unexpected.error"),
        type: "error",
      });
    } finally {
      hideLoading();
      setTimeout(() => {
        window.location.reload();
      }, 0);
    }
  }
</script>

<div class="flex flex-col">
  <div
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 py-2"
  >
    {#each cards as card, index}
      {#if index < promptLimit || showMore}
        <ExecutionCardItem
          {isEditable}
          data={card}
          active={selectedCardIndex == index}
          onSelectCart={() => selectCard(index)}
          onSelectEdit={() => {
            editCard(index);
          }}
          onSelectDuplicate={() => {
            duplicateCard(index);
          }}
          onSelectReOder={() => {
            // TODO: Handle Order
          }}
          onSelectDelete={() => {
            onDeleteCard(index);
          }}
        />
      {/if}
    {/each}
  </div>

  {#if cards.length > promptLimit}
    <div class="flex">
      <button
        class="btn p-0 btn-link text-sm font-normal"
        on:click={() => (showMore = !showMore)}
      >
        {showMore
          ? `${t("prompt-execution.card.showLess")} ↑`
          : `${t("prompt-execution.card.showMore")} ↓`}
      </button>
    </div>
  {/if}
</div>

<ConfirmDialog
  description={t("prompt-library.delete.prompt.confirm")}
  bind:modal={confirmDeleteModal}
  on:confirm={deleteCard}
/>

<EditPromptDetails
  bind:dlgEl
  bind:selectedEditPromptId
  dialogMode={promptDialogMode}
  dialogTitle={promptDialogMode == "clone"
    ? t("prompt-library.clone.title")
    : t("prompt-library.edit.title")}
/>

<Loading bind:show={$loading} />
