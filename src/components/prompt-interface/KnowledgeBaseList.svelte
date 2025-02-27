<script lang="ts" module>
  export interface KnowledgeBaseCardItem {
    id: string;
    title: string;
    description?: string;
    instruction?: string;
    modifiedBy?: string;
    modifiedAt?: Date | string;
  }
</script>

<script lang="ts">
  import KnowledgeBaseItem from "./KnowledgeBaseItem.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import Loading from "$components/Loading.svelte";
  import { loading, showLoading, hideLoading } from "$stores";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  interface Props {
    items?: KnowledgeBaseCardItem[];
    title?: string;
    isEditable?: boolean;
  }

  let {
    items = $bindable([]),
    title = t("prompt-library.knowledgebase.all"),
    isEditable = false,
  }: Props = $props();

  $inspect(items);

  let selectedEditKnowledgeBaseId: string = $state("");
  let selectedDeletePKnowledgeBaseId: string = "";

  let confirmDeleteModal: HTMLDialogElement | undefined = $state();

  async function editCard(index: number) {
    selectedEditKnowledgeBaseId = items[index]?.id ?? "";
    window.location.href = "/prompt-library/knowledge-base/" + selectedEditKnowledgeBaseId;
  }

  async function duplicateCard(index: number) {
    selectedEditKnowledgeBaseId = items[index]?.id ?? "";
  }

  function onDeleteCard(index: number) {
    selectedDeletePKnowledgeBaseId = items[index]?.id ?? "";
    confirmDeleteModal?.show();
  }

  function removeDeletedItem(deletedId: string) {
    items = items?.filter((item: any) => item.id !== deletedId);
  }

  async function deleteCard() {
    try {
      showLoading();
      const deletedKnowledgeBase = {
        ...(selectedDeletePKnowledgeBaseId && {
          _id: selectedDeletePKnowledgeBaseId,
        }),
      };
      const response = await fetch("/api/knowledge-base.json", {
        method: "DELETE",
        body: JSON.stringify(deletedKnowledgeBase),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || t("prompt-library.delete.knowledge-base.failed"),
        );
      }
      removeDeletedItem(selectedDeletePKnowledgeBaseId);
      hideLoading();
      addToast({
        message: t("prompt-library.delete.knowledge-base.success"),
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
      <KnowledgeBaseItem
        {isEditable}
        data={card}
        onSelectEdit={() => {
          editCard(index);
        }}
        onSelectDuplicate={() => {
          duplicateCard(index);
        }}
        onSelectDelete={() => {
          onDeleteCard(index);
        }}
      />
    {/each}
  </div>
</div>

<ConfirmDialog
  bind:modal={confirmDeleteModal}
  confirm={deleteCard}
  title={t("prompt-library.delete.knowledge-base.confirm")}
/>

<Loading bind:show={$loading} />
