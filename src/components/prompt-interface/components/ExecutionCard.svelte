<script lang="ts">
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { storePromptId } from "$components/prompt-interface/components/Stores";
  import EditPromptDetails from "$components/prompt-interface/components/EditPromptDetails.svelte";
  import ExecutionCardItem from "$components/prompt-interface/components/ExecutionCardItem.svelte";
  import PromptOrderDialog from "$components/prompt-interface/components/PromptOrderDialog.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import Loading from "$components/Loading.svelte";
  import { addToast } from "$stores/toast";
  import { actions } from "astro:actions";
  import log from "$utils/log";

  interface Props {
    isEditable?: boolean;
    isDisabling?: boolean;
    cards: any;
    selectedPromptId: any;
    onSelectCard?: Function;
  }

  let {
    isEditable = $bindable(false),
    isDisabling = $bindable(false),
    cards = $bindable(),
    selectedPromptId = $bindable(),
    onSelectCard = () => null,
  }: Props = $props();

  const t = useTranslations();
  let loading = $state(false);

  const promptLimit = 5;
  let showMore = $state(false);
  let selectedCardIndex: number = $state(-1);
  let selectedEditPromptId: string = $state("");
  let selectedDeletePromptId: string = "";
  let promptDialog: HTMLDialogElement | undefined = $state();
  let promptDialogMode: "update" | "clone" = $state("update");
  let confirmDeleteModal: HTMLDialogElement | undefined = $state();
  let promptOrderDialog: HTMLDialogElement | undefined = $state();

  let timeout: any = $state();
  let orderCards = $state(cards);
  // svelte-ignore state_referenced_locally
  for (let i = 0; i < orderCards?.length; i++) {
    orderCards[i] = { ...orderCards[i], id: orderCards[i]._id };
  }

  onMount(async function () {
    selectedCardIndex = 0;
    selectedPromptId = cards[0]._id;
    storePromptId.set(selectedPromptId);
    if (selectedEditPromptId) {
      promptDialog?.showModal();
    }
  });

  function selectCard(index: number) {
    if (isDisabling) {
      addToast({
        message: t("prompt-execution.a-prompt-is-being-executed-please-wait"),
        type: "info",
      });
      return;
    }
    onSelectCard?.();
    selectedCardIndex = index;
    selectedPromptId = cards[index]?._id ?? "";
    storePromptId.set(selectedPromptId);
  }

  async function editCard(index: number) {
    selectedEditPromptId = cards[index]?._id ?? "";
    promptDialogMode = "update";
    promptDialog?.showModal();
  }

  async function duplicateCard(index: number) {
    selectedEditPromptId = cards[index]?._id ?? "";
    promptDialogMode = "clone";
    promptDialog?.showModal();
  }

  function onDeleteCard(index: number) {
    selectedDeletePromptId = cards[index]?._id ?? "";
    confirmDeleteModal?.show();
  }

  function removeDeletedItem(deletedId: string) {
    cards = cards?.filter((item: any) => item._id !== deletedId);
    orderCards = orderCards?.filter((item: any) => item._id !== deletedId);
  }

  async function deleteCard() {
    try {
      loading = true;
      const deletedPrompt = {
        ...(selectedDeletePromptId && { _id: selectedDeletePromptId }),
      };
      const response = await fetch("/api/prompts/index.json", {
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
      loading = false;
      addToast({
        message: t("prompt-library.delete.prompt.success"),
        type: "success",
      });
    } catch (error) {
      loading = false;
      addToast({
        message:
          error instanceof Error ? error.message : t("common.unexpected.error"),
        type: "error",
      });
    }
  }

  function orderPrompt() {
    promptOrderDialog?.show();
  }

  async function updatePosition(items: any[]) {
    loading = true;
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
      loading = false;
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
          onSelectReorder={() => {
            orderPrompt();
          }}
          onSelectDelete={() => {
            onDeleteCard(index);
          }}
          zIndex={50 - index}
        />
      {/if}
    {/each}
  </div>

  {#if cards.length > promptLimit}
    <div class="flex">
      <button
        class="btn p-0 btn-link text-sm font-normal"
        onclick={() => (showMore = !showMore)}
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
  confirm={() => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      updatePosition(orderCards);
    }, 100);
  }}
/>

<ConfirmDialog
  bind:modal={confirmDeleteModal}
  confirm={deleteCard}
  title={t("prompt-library.delete.prompt.confirm")}
/>

<Loading show={loading} />
