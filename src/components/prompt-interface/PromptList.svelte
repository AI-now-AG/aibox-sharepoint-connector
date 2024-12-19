<script lang="ts">
  import PromptItem from "$components/prompt-interface/PromptItem.svelte";
  import EditPromptDetails from "$components/prompt-interface/components/EditPromptDetails.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import Loading from "$components/Loading.svelte";
  import { loading, showLoading, hideLoading } from "$stores";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";
  import log from "$utils/log";

  interface CardItem {
    id: string;
    title: string;
    description?: string;
    instruction: string;
    tags?: string[];
  }

  const t = useTranslations();

  export let items: CardItem[] = [];
  export let title: string = t("prompt-library.prompts.all");
  export let isEditable: boolean = false;

  let selectedEditPromptId: string = "";
  let selectedDeletePromptId: string = "";
  let promptDialog: HTMLDialogElement;
  let promptDialogMode: "update" | "clone" = "update";
  let confirmDeleteModal: HTMLDialogElement;

  async function editCard(index: number) {
    selectedEditPromptId = items[index]?.id ?? "";
    promptDialogMode = "update";
    promptDialog.showModal();
  }

  async function duplicateCard(index: number) {
    selectedEditPromptId = items[index]?.id ?? "";
    promptDialogMode = "clone";
    promptDialog.showModal();
  }

  function onDeleteCard(index: number) {
    selectedDeletePromptId = items[index]?.id ?? "";
    confirmDeleteModal?.show();
  }

  function removeDeletedItem(deletedId: string) {
    items = items?.filter((item: any) => item.id !== deletedId);
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
        onSelectReOder={() => {
          // TODO: Handle Order
        }}
        onSelectDelete={() => {
          onDeleteCard(index);
        }}
      />
    {/each}
  </div>
</div>

<ConfirmDialog
  description={t("prompt-library.delete.prompt.confirm")}
  bind:modal={confirmDeleteModal}
  on:confirm={deleteCard}
/>

<EditPromptDetails
  bind:promptDialog
  bind:selectedEditPromptId
  dialogMode={promptDialogMode}
  dialogTitle={promptDialogMode == "clone"
    ? t("prompt-library.clone.title")
    : t("prompt-library.edit.title")}
/>

<Loading bind:show={$loading} />
