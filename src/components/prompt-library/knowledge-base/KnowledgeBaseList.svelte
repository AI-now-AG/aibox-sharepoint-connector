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
  import { navigate } from "astro:transitions/client";
  import KnowledgeBaseItem from "./KnowledgeBaseItem.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import Loading from "$components/Loading.svelte";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";
  import EmptyActiion from "../../prompt-interface/EmptyAction.svelte";

  const t = useTranslations();
  let loading = $state(false);

  interface Props {
    title?: string;
    isEditable?: boolean;
    items?: KnowledgeBaseCardItem[];
  }

  let {
    title = t("prompt-library.knowledgebase.all"),
    isEditable = false,
    items = [],
  }: Props = $props();

  let selectedEditKnowledgeBaseId: string = $state("");
  let selectedDeletePKnowledgeBaseId: string = "";

  let confirmDeleteModal: HTMLDialogElement | undefined = $state();

  async function editCard(index: number) {
    selectedEditKnowledgeBaseId = items[index]?.id ?? "";
    //window.location.href = `/prompt-library/knowledge-base/${selectedEditKnowledgeBaseId}`;
    navigate(`/prompt-library/knowledge-base/${selectedEditKnowledgeBaseId}`);
  }

  async function duplicateCard(index: number) {
    selectedEditKnowledgeBaseId = items[index]?.id ?? "";
    //window.location.href = `/prompt-library/knowledge-base/${selectedEditKnowledgeBaseId}?mode=clone`;
    navigate(
      `/prompt-library/knowledge-base/${selectedEditKnowledgeBaseId}?mode=clone`,
    );
  }

  function onDeleteCard(index: number) {
    selectedDeletePKnowledgeBaseId = items[index]?.id ?? "";
    confirmDeleteModal?.showModal();
  }

  function removeDeletedItem(deletedId: string) {
    items = items?.filter((item: any) => item.id !== deletedId);
  }

  async function deleteCard() {
    try {
      loading = true;
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
      loading = false;
      addToast({
        message: t("prompt-library.delete.knowledge-base.success"),
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
</script>

<div class="container max-w-5xl mx-auto p-6 space-y-4">
  {#if items?.length > 0}
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
  {:else}
    <EmptyActiion
      title={t("knowledgebase.empty.title")}
      description={t("knowledgebase.empty.description")}
      ctaLabel={t("prompt-library.knowledgebase.add")}
      ctaUrl="/prompt-library/knowledge-base/add"
    />
  {/if}
</div>

<ConfirmDialog
  bind:modal={confirmDeleteModal}
  confirm={deleteCard}
  title={t("prompt-library.delete.knowledge-base.confirm")}
/>

<Loading show={loading} />
