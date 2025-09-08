<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  import { addToast } from "$stores/toast";
  import { actions } from "astro:actions";
  import { preventDefault } from "$utils/common";
  import Loading from "./Loading.svelte";
  const t = useTranslations();

  interface Props {
    conversationDialog?: HTMLDialogElement;
    dialogTitle?: string;
    conversations: any[];
  }

  let {
    conversationDialog = $bindable(),
    dialogTitle = "My aibox Conversations",
    conversations = $bindable([]),
  }: Props = $props();

  let loading: boolean = $state(false);

  function removeDeletedItem(deletedId: string) {
    conversations = conversations?.filter(
      (item: any) => item._id !== deletedId,
    );
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

  function cancel() {
    conversationDialog?.close();
  }
</script>

<dialog bind:this={conversationDialog} class="modal">
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
            <span class="text-sm">{conversation.title}</span>
            <button
              onclick={() => deleteConversation(conversation._id)}
              class="btn btn-primary btn-outline btn-sm"
            >
              {@html svgIcons.trash}
              {t("conversation.remove-from-my-ai-box")}
            </button>
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
