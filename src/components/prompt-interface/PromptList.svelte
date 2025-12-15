<script lang="ts" module>
  export interface PromptCartItem {
    id: string;
    title: string;
    description?: string;
    instruction: string;
    group?: string;
    tags?: string[];
  }
</script>

<script lang="ts">
  import { navigate } from "astro:transitions/client";
  import PromptItem from "$components/prompt-interface/PromptItem.svelte";
  import EditPromptDialog from "$components/prompt-library/prompts/EditPromptDialog.svelte";
  import PromptOrderDialog from "$components/prompt-interface/PromptOrderDialog.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import Loading from "$components/Loading.svelte";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";
  import { actions } from "astro:actions";
  import log from "$utils/log";

  const t = useTranslations();
  let loading = $state(false);

  interface Props {
    items?: PromptCartItem[];
    onItemSelect?: Function;
    title?: string;
    isEditable?: boolean;
    cssClasses?: string;
  }

  let {
    items = $bindable([]),
    onItemSelect = () => null,
    title = t("prompt-library.prompts.all"),
    isEditable = false,
    cssClasses = "",
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

  function getItemsByGroupId(
    items: PromptCartItem[],
    groupId: string,
  ): PromptCartItem[] {
    return items.filter((item) => item.group === groupId);
  }

  function editCard(index: number) {
    selectedEditPromptId = items[index]?.id ?? "";
    promptDialogMode = "update";
    // Use show() instead of showModal() to allow toast visibility
    promptDialog?.show();
  }

  function duplicateCard(index: number) {
    selectedEditPromptId = items[index]?.id ?? "";
    promptDialogMode = "clone";
    // Use show() instead of showModal() to allow toast visibility
    promptDialog?.show();
  }

  function onDeleteCard(index: number) {
    selectedDeletePromptId = items[index]?.id ?? "";
    confirmDeleteModal?.showModal();
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

      loading = false;
      addToast({
        message: t("prompt-library.delete.prompt.success"),
        type: "success",
      });

      navigate(window.location.href);
    } catch (error) {
      loading = false;
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

  async function updatePosition(orderItems: PromptCartItem[]) {
    loading = true;
    try {
      const sortedIds = orderItems.map((item) => {
        return {
          _id: item.id,
        };
      });
      const newItems = await actions.prompt.updatePosition(sortedIds);
      items = (newItems.data ?? orderItems) as PromptCartItem[];
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

<div class={"container max-w-5xl mx-auto p-6 space-y-4 " + cssClasses}>
  <h1 class="text-lg font-normal text-base-content/80">
    {title}
  </h1>

  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
    {#each items as item, index}
      <PromptItem
        {isEditable}
        data={item}
        onItemSelect={() => {
          onItemSelect(item);
        }}
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

<EditPromptDialog
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
