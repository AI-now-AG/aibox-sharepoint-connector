<script lang="ts">
  import AudioUsecaseItem from "./AudioUsecaseItem.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import Loading from "$components/Loading.svelte";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";
  import { actions } from "astro:actions";
  import type { AudioCardItem } from "$types/AudioCardItem";
  import type { TranscriptionType } from "$types/TranscribeRequest";
  import { tenant } from "$stores";

  const t = useTranslations();
  let loading = $state(false);

  interface Props {
    items?: AudioCardItem[];
    typeParam: TranscriptionType;
    title?: string;
    isEditable?: boolean;
  }

  let {
    items = $bindable([]),
    typeParam,
    title = t("settings.transcription.all.usecases"),
    isEditable = false,
  }: Props = $props();

  let selectedDeletePromptId: string = "";
  let confirmDeleteModal: HTMLDialogElement | undefined = $state();

  let timeout: any = $state();

  async function editCard(index: number) {
    const params = new URLSearchParams({
      type: typeParam,
      id: items[index]?.id || "",
    });

    window.location.assign(
      `/settings/transcription/UsecaseForm?${params.toString()}`,
    );
  }

  async function duplicateCard(index: number) {
    const params = new URLSearchParams({
      type: typeParam,
      id: items[index]?.id || "",
      mode: "clone",
    });

    window.location.assign(
      `/settings/transcription/UsecaseForm?${params.toString()}`,
    );
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
      loading = true;
      const deletedUsecase = {
        _id: selectedDeletePromptId,
      };
      await actions.transcription.delete(deletedUsecase);

      removeDeletedItem(selectedDeletePromptId);
      loading = false;
      addToast({
        message: t("settings.transcription.delete.success"),
        type: "success",
      });
      reloadPage();
    } catch (error) {
      loading = false;
      addToast({
        message:
          error instanceof Error ? error.message : t("common.unexpected.error"),
        type: "error",
      });
    }
  }

  async function updateCardStatus(index: number) {
    const selectedItem = items[index];
    try {
      loading = true;
      const updateUsecase = {
        _id: selectedItem.id,
      };
      if (!selectedItem.enabled) {
        await actions.transcription.active(updateUsecase);
      } else {
        await actions.transcription.deactive(updateUsecase);
      }

      loading = false;
      addToast({
        message: t("settings.transcription.updated.success"),
        type: "success",
      });
      reloadPage();
    } catch (error) {
      loading = false;
      addToast({
        message:
          error instanceof Error ? error.message : t("common.unexpected.error"),
        type: "error",
      });
    }
  }

  function reloadPage(delay = 1500) {
    setTimeout(() => {
      window.location.reload();
    }, delay);
  }
</script>

<div class="container max-w-5xl mx-auto p-6 space-y-4">
  <h1 class="text-lg font-normal text-base-content/80">
    {title}
  </h1>

  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
    {#each items as card, index}
      <AudioUsecaseItem
        isEditable={$tenant?.transcription_types?.includes(card.category) ??
          true}
        item={card}
        onSelectEdit={() => {
          editCard(index);
        }}
        onSelectDelete={() => {
          onDeleteCard(index);
        }}
        onSelectDuplicate={() => {
          duplicateCard(index);
        }}
        onSelecteEnabled={() => {
          updateCardStatus(index);
        }}
      />
    {/each}
  </div>
</div>

<ConfirmDialog
  bind:modal={confirmDeleteModal}
  confirm={deleteCard}
  title={t("settings.transcription.delete.confirm")}
/>

<Loading show={loading} />
