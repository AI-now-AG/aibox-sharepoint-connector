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
  import { svgIcons } from "$assets/icons";
  import KnowledgeBaseItem from "./KnowledgeBaseItem.svelte";
  import KbFromWebsiteDialog from "./KbFromWebsiteDialog.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import Loading from "$components/Loading.svelte";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";
  import EmptyAction from "../../prompt-interface/EmptyAction.svelte";

  const t = useTranslations();
  let loading = $state(false);

  interface Props {
    title?: string;
    isEditable?: boolean;
    items?: KnowledgeBaseCardItem[];
    tenantId?: string;
    promptKbInstruction?: string;
  }

  let {
    title = t("prompt-library.knowledgebase.all"),
    isEditable = false,
    items = $bindable([]),
    tenantId = "",
    promptKbInstruction = "",
  }: Props = $props();

  let selectedEditKnowledgeBaseId: string = $state("");
  let selectedDeletePKnowledgeBaseId: string = "";

  let confirmDeleteModal: HTMLDialogElement | undefined = $state();
  let websiteKbDialog: HTMLDialogElement | undefined = $state();

  async function editCard(index: number) {
    selectedEditKnowledgeBaseId = items[index]?.id ?? "";
    navigate(`/prompt-library/knowledge-base/${selectedEditKnowledgeBaseId}`);
  }

  async function duplicateCard(index: number) {
    selectedEditKnowledgeBaseId = items[index]?.id ?? "";
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

  function onModalClosed() {
    navigate(window.location.href);
  }

  function openWebsiteKbDialog() {
    websiteKbDialog?.showModal();
  }
</script>

<div class="container max-w-5xl mx-auto p-6 space-y-4">
  {#if isEditable}
    <div class="flex justify-end">
      <div class="dropdown dropdown-end">
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div tabindex="0" role="button" class="btn btn-outline font-normal">
          {@html svgIcons.add}
          {t("prompt-library.knowledgebase.add")}
        </div>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <ul
          tabindex="0"
          class="dropdown-content menu bg-base-100 rounded-xl shadow z-10 w-56 p-2 mt-1"
        >
          <li>
            <a
              href="/prompt-library/knowledge-base/add"
              class="flex items-center gap-2"
            >
              📄 {t("kb.add-dialog.empty-kb-title")}
            </a>
          </li>
          <li>
            <button
              class="flex items-center gap-2 w-full"
              onclick={openWebsiteKbDialog}
            >
              🌐 {t("kb.add-dialog.company-kb-title")}
            </button>
          </li>
        </ul>
      </div>
    </div>
  {/if}

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
  {:else if !isEditable}
    <EmptyAction
      title={t("knowledgebase.empty.title")}
      description={t("knowledgebase.empty.description")}
      ctaLabel={t("prompt-library.knowledgebase.add")}
      ctaUrl="/prompt-library/knowledge-base/add"
    />
  {:else}
    <EmptyAction
      title={t("knowledgebase.empty.title")}
      description={t("knowledgebase.empty.description")}
    />
  {/if}
</div>

<KbFromWebsiteDialog
  bind:modal={websiteKbDialog}
  {tenantId}
  {promptKbInstruction}
  {onModalClosed}
/>

<ConfirmDialog
  bind:modal={confirmDeleteModal}
  confirm={deleteCard}
  title={t("prompt-library.delete.knowledge-base.confirm")}
/>

<Loading show={loading} />
