<script lang="ts" module>
  export interface CardItem {
    id: string;
    title: string;
    description?: string;
    instruction: string;
    group?: string;
    tags?: string[];
  }
</script>

<script lang="ts">
  import PromptItem from "$components/prompt-interface/PromptItem.svelte";
  import EditPromptDetails from "$components/prompt-interface/components/EditPromptDetails.svelte";
  import PromptOrderDialog from "$components/prompt-interface/components/PromptOrderDialog.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import Loading from "$components/Loading.svelte";
  import { loading, showLoading, hideLoading } from "$stores";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";
  import { actions } from "astro:actions";
  import log from "$utils/log";

  const t = useTranslations();

  interface Props {
    items?: CardItem[];
    title?: string;
    isEditable?: boolean;
  }

  let {
    items = $bindable([]),
    title = t("prompt-library.prompts.all"),
    isEditable = false,
  }: Props = $props();

  let selectedEditPromptId: string = $state("");
  let selectedDeletePromptId: string = "";
  let selectedOrderPromptId: string = "";
  let promptDialog: HTMLDialogElement | undefined = $state();
  let promptDialogMode: "update" | "clone" = $state("update");
  let confirmDeleteModal: HTMLDialogElement | undefined = $state();
  let promptOrderDialog: HTMLDialogElement | undefined = $state();

  let timeout: any = $state();
  let orderCards = $state(items);

  function getItemsByGroupId(items: CardItem[], groupId: string): CardItem[] {
    return items.filter((item) => item.group === groupId);
  }

  async function editCard(index: number) {
    selectedEditPromptId = items[index]?.id ?? "";
    promptDialogMode = "update";
    promptDialog?.showModal();
  }

  async function duplicateCard(index: number) {
    selectedEditPromptId = items[index]?.id ?? "";
    promptDialogMode = "clone";
    promptDialog?.showModal();
  }

  function onDeleteCard(index: number) {
    selectedDeletePromptId = items[index]?.id ?? "";
    confirmDeleteModal?.show();
  }

  function removeDeletedItem(deletedId: string) {
    items = items?.filter((item: any) => item.id !== deletedId);
    orderCards = orderCards?.filter((item: any) => item.id !== deletedId);
  }

  async function deleteCard() {
    try {
      showLoading();
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

  function orderPrompt(index: number) {
    selectedOrderPromptId = items[index]?.id ?? "";
    const selectedItem = items[index];
    const groupIdToSearch = selectedItem.group ?? "";
    orderCards = getItemsByGroupId(items ?? [], groupIdToSearch);
    promptOrderDialog?.show();
  }

  async function updatePosition(orderItems: CardItem[]) {
    showLoading();
    try {
      const sortedIds = orderItems.map((item) => {
        return {
          _id: item.id,
        };
      });
      const newItems = await actions.prompt.updatePosition(sortedIds);
      items = (newItems.data ?? orderItems) as CardItem[];
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

<div class="container max-w-5xl mx-auto p-6 space-y-4">
  <h1 class="text-lg font-normal text-base-content/80">
    {title}
  </h1>

  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
    {#each items as card, index}
      <PromptItem
        {isEditable}
        data={card}
        onSelectEdit={() => {
          editCard(index);
        }}
        onSelectDuplicate={() => {
          duplicateCard(index);
        }}
        onSelectReorder={() => {
          orderPrompt(index);
        }}
        onSelectDelete={() => {
          onDeleteCard(index);
        }}
      />
    {/each}
  </div>
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

<Loading bind:show={$loading} />
