<script lang="ts">
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  import { addToast } from "$stores/toast";
  import { actions } from "astro:actions";
  import { preventDefault } from "$utils/common";
  import Loading from "./Loading.svelte";
  import dayjs from "dayjs";
  const t = useTranslations();

  interface Props {
    conversationDialog?: HTMLDialogElement;
    dialogTitle?: string;
  }

  let {
    conversationDialog = $bindable(),
    dialogTitle = t("conversation.my-ai-box-conversation-dialog-title"),
  }: Props = $props();

  let loading: boolean = $state(false);
  let conversations: any[] = $state([]);
  let editingId: string | null = $state(null); // Tracks the ID of the conversation being edited
  let newTitle: string = $state(""); // Stores the new title as the user types

  async function getListConversation() {
    try {
      const { error, data } = await actions.conversation.list({});
      if (!error) {
        conversations = data;
      } else {
        console.error(error);
      }
    } catch (error) {
      console.error("Exception when get conversations", error);
    }
  }

  onMount(async () => {
    getListConversation();
  });

  function removeDeletedItem(deletedId: string) {
    conversations = conversations?.filter(
      (item: any) => item._id !== deletedId,
    );
    if (conversations.length === 0) {
      window.location.href = "/";
    }
  }

  async function deleteConversation(conversationId: string) {
    try {
      loading = true;
      const { error } = await actions.conversation.delete({
        _id: conversationId,
      });
      if (!error) {
        removeDeletedItem(conversationId);
        addToast({
          message: t("conversation.delete-conversation-successfull"),
          type: "success",
        });
      } else {
        addToast({ message: JSON.stringify(error), type: "error" });
      }
    } catch (error) {
      console.error("Exception when delete conversation", error);
    } finally {
      loading = false;
    }
  }

  // Starts the editing process for a conversation
  function startEditing(conversation: any) {
    editingId = conversation._id;
    newTitle = conversation.title;
  }

  // Cancels the editing process
  function cancelEditing() {
    editingId = null;
    newTitle = "";
  }

  // Saves the new title
  async function saveTitle(conversation: any) {
    try {
      loading = true;

      const { error } = await actions.conversation.update({
        ...conversation,
        title: newTitle,
      });

      if (!error) {
        conversations = conversations.map((c) =>
          c._id === conversation._id ? { ...c, title: newTitle } : c,
        );
        addToast({
          message: t("conversation.update-conversation-successfull"),
          type: "success",
        });
        cancelEditing(); // Exit editing mode
      } else {
        addToast({ message: JSON.stringify(error), type: "error" });
      }
    } catch (error) {
      console.error("Exception when updating conversation", error);
    } finally {
      loading = false;
    }
  }

  function cancel() {
    conversationDialog?.close();
  }
</script>

<dialog
  bind:this={conversationDialog}
  class="modal"
  id="my-ai-box-conversation-dialog"
>
  <div class="modal-box w-8/12 max-w-5xl">
    <div class="flex justify-between">
      <h3 class="text-lg font-bold py-4">{dialogTitle}</h3>
      <button class="btn btn-sm btn-circle btn-ghost" onclick={cancel}>
        {@html svgIcons.closeMenu}
      </button>
    </div>

    <section>
      <div class="min-h-0 max-h-full overflow-y-auto space-y-2">
        {#each conversations as conversation}
          <div
            class="flex items-center justify-between border-b px-2 py-1 rounded-lg border"
          >
            {#if editingId === conversation._id}
              <input
                type="text"
                class="input input-bordered input-sm flex-1 text-sm"
                bind:value={newTitle}
                onkeydown={(e) => {
                  if (e.key === "Enter") {
                    saveTitle(conversation);
                  } else if (e.key === "Escape") {
                    cancelEditing();
                  }
                }}
              />
            {:else}
              <a
                href={"/conversations/" + conversation._id}
                class="flex items-center flex-1"
              >
                <span class="text-sm">{conversation.title}</span>
              </a>
            {/if}

            <span class="text-xs text-left mx-4"
              >{dayjs(conversation.updated_at).format("DD.MM.YYYY HH:mm")}</span
            >

            {#if editingId === conversation._id}
              <button
                onclick={preventDefault(() => saveTitle(conversation))}
                class="btn btn-secondary btn-outline btn-sm mr-2"
              >
                {@html svgIcons.check}
                {t("common.save")}
              </button>
              <button
                onclick={preventDefault(cancelEditing)}
                class="btn btn-secondary btn-outline btn-sm"
              >
                {@html svgIcons.cancel}
                {t("common.cancel")}
              </button>
            {:else}
              <button
                onclick={preventDefault(() => startEditing(conversation))}
                class="btn btn-primary btn-outline btn-sm mr-2"
              >
                {@html svgIcons.edit}
                {t("conversation.edit-title")}
              </button>
              <button
                onclick={preventDefault(() =>
                  deleteConversation(conversation._id),
                )}
                class="btn btn-primary btn-outline btn-sm"
              >
                {@html svgIcons.trash}
                {t("conversation.remove-from-my-ai-box")}
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </section>

    <div class="flex justify-end">
      <button
        class="btn btn-active btn-primary px-8 font-normal mt-4"
        onclick={preventDefault(cancel)}
      >
        {t("common.close")}
      </button>
    </div>
  </div>
</dialog>

<Loading show={loading} />
