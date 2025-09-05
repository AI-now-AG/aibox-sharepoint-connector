<script lang="ts">
  import { PromptToolOption } from "$types/AIProvider";
  import { type MessageHistory } from "$types/MessageHistory";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import MessageInput from "$components/chat-ui/MessageInput.svelte";
  import MessageList from "$components/chat-ui/MessageList.svelte";
  import { useTranslations } from "$i18n/utils";
  import { actions } from "astro:actions";
  import Loading from "$components/Loading.svelte";
  import { addToast } from "$stores/toast";
  import { getPromptTools, useProviderInfo } from "$shared/AIProvider";
  import { tenant } from "$stores";
  import { PromptModel } from "$types/PromptModel";

  const t = useTranslations();
  interface Props {
    conversationId: string;
    model: string;
    messages: MessageHistory;
    promptData: any;
  }

  let {
    conversationId,
    model = PromptModel.Default,
    messages,
    promptData,
  }: Props = $props();

  let input: string = $state("");
  let files: File[] = $state([]);
  let currentMessage = $state("");
  let currentStreamingImageUrl: string = $state("");
  let isFetching: boolean = $state(false);
  let isGenerating: boolean = $state(false);

  const providerIno = useProviderInfo($tenant);
  // === Derived State ===
  let toolOptions = getPromptTools(
    (model == PromptModel.Default
      ? providerIno?.defaultProviderPromptModelName == PromptModel.OpenAI
        ? PromptModel.OpenAIWithTools
        : providerIno?.defaultProviderPromptModelName
      : model) as PromptModel,
  );

  let selectedPromptTool = $state(PromptToolOption.None);
  let isDisablePromptTool = $state(false);

  let loading = $state(false);

  async function deleteConversation() {
    try {
      loading = true;
      const { error } = await actions.conversation.delete({
        _id: conversationId,
      });
      if (!error) {
        window.location.href = "/";
      } else {
        addToast({ message: JSON.stringify(error), type: "error" });
      }
    } catch (error) {
      console.error("Exception when delete conversation", error);
    } finally {
      loading = false;
    }
  }

  async function submitForm() {}
</script>

<div class="grid grid-cols-1 grid-rows-[1fr_min-content] h-full">
  <div class="flex justify-end">
    <button
      class="btn btn-outline font-normal"
      onclick={() => {
        deleteConversation();
      }}
    >
      {t("conversation.remove-from-my-ai-box")}
    </button>
  </div>

  <MessageList
    {currentMessage}
    {messages}
    currentImageUrl={currentStreamingImageUrl}
    {isFetching}
    {isGenerating}
    isResoningThingking={false}
  />

  <div class="sticky bottom-0 bg-base-200">
    <div class="my-4">
      <div class="mt-2">
        <ScrollToBottom />
      </div>
    </div>

    <div class="min-w-full form-wrapper">
      <MessageInput
        bind:input
        bind:files
        {isFetching}
        stickyFooter={true}
        onsend={submitForm}
        {toolOptions}
        bind:selectedPromptTool
        bind:isDisablePromptTool
        showDataLossWarning={false}
      />
    </div>
  </div>
</div>

<Loading show={loading} />
