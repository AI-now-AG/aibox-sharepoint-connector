<script lang="ts">
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { storePromptId } from "$components/prompt-interface/components/Stores";
  import EditPromptDetails from "$components/prompt-interface/components/EditPromptDetails.svelte";
  import ExecutionCardItem from "$components/prompt-interface/components/ExecutionCardItem.svelte";
  import PromptOrderDialog from "$components/prompt-interface/components/PromptOrderDialog.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import Loading from "$components/Loading.svelte";
  import { loading, showLoading, hideLoading } from "$stores";
  import { addToast } from "$stores/toast";
  import { actions } from "astro:actions";
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
  let promptDialog: HTMLDialogElement;
  let promptDialogMode: "update" | "clone" = "update";
  let confirmDeleteModal: HTMLDialogElement;
  let promptOrderDialog: HTMLDialogElement;

  let timeout: any;
  let orderCards = cards;
  for (let i = 0; i < orderCards?.length; i++) {
    orderCards[i] = { ...orderCards[i], id: i + 1 };
  }

  onMount(async function () {
    selectedCardIndex = 0;
    selectedPromptId = cards[0]._id;
    storePromptId.set(selectedPromptId);
    if (selectedEditPromptId) {
      promptDialog.showModal();
    }
  });

  function selectCard(index: number) {
    selectedCardIndex = index;
    selectedPromptId = cards[index]?._id ?? "";
    storePromptId.set(selectedPromptId);
  }

  async function editCard(index: number) {
    selectedEditPromptId = cards[index]?._id ?? "";
    promptDialogMode = "update";
    promptDialog.showModal();
  }

  async function duplicateCard(index: number) {
    selectedEditPromptId = cards[index]?._id ?? "";
    promptDialogMode = "clone";
    promptDialog.showModal();
  }

  function onDeleteCard(index: number) {
    selectedDeletePromptId = cards[index]?._id ?? "";
    confirmDeleteModal?.show();
  }

  function removeDeletedItem(deletedId: string) {
    cards = cards?.filter((item: any) => item._id !== deletedId);
  }

  async function deleteCard() {
    try {
      showLoading();
      const deletedPrompt = {
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
      removeDeletedItem(selectedDeletePromptId);
      hideLoading();
      addToast({
        message: t("prompt-library.delete.prompt.success"),
        type: "success",
      });
    } catch (error) {
      hideLoading();
      addToast({
        message:
          error instanceof Error ? error.message : t("common.unexpected.error"),
        type: "error",
      });
    }
  }

  function orderPrompt() {
    promptOrderDialog.show();
  }

  async function updatePosition(items: any[]) {
    showLoading();
    try {
      const sortedIds = items.map((item) => {
        return {
          _id: item._id,
        };
      });
      await actions.prompt.updatePosition(sortedIds);
      cards = orderCards;
      addToast({
        message: t("prompt-library.prompt.order-success"),
        type: "success",
      });
    } catch (error) {
      log.e(error, "Error happening during update position");
      addToast({
        message: t("prompt-library.prompt.order-failed"),
        type: "error",
      });
    } finally {
      hideLoading();
    }
  }
</script>

<div class="flex flex-col">
  <div
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-4 py-2"
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
            orderPrompt();
          }}
          onSelectDelete={() => {
            onDeleteCard(index);
          }}
          zIndex={100 - index}
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

<EditPromptDetails
  bind:promptDialog
  bind:selectedEditPromptId
  dialogMode={promptDialogMode}
  dialogTitle={promptDialogMode == "clone"
    ? t("prompt-library.clone.title")
    : t("prompt-library.edit.title")}
/>

<PromptOrderDialog
  bind:promptOrderDialog
  bind:items={orderCards}
  on:confirm={() => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      updatePosition(orderCards);
    }, 100);
  }}
/>

<ConfirmDialog
  description={t("prompt-library.delete.prompt.confirm")}
  bind:modal={confirmDeleteModal}
  on:confirm={deleteCard}
/>

<Loading bind:show={$loading} />
