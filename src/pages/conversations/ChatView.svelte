<script lang="ts">
  import { PromptToolOption } from "$types/AIProvider";
  import { MessageRole, type MessageHistory } from "$types/MessageHistory";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import MessageInput from "$components/chat-ui/MessageInput.svelte";
  import MessageList from "$components/chat-ui/MessageList.svelte";

  interface Props {
    conversationId: string;
    messages: MessageHistory;
    promptData: any;
  }
  let { conversationId, messages, promptData }: Props = $props();

  let prompt: string = $state("");
  let files: File[] = $state([]);
  let currentMessage = $state("");
  let currentStreamingImageUrl: string = $state("");
  let isFetching: boolean = $state(false);
  let isGenerating: boolean = $state(false);

  let selectedPromptTool = $state(PromptToolOption.None);
  let isDisablePromptTool = $state(false);

  async function submitForm() {}
</script>

<MessageList
  {currentMessage}
  {messages}
  currentImageUrl={currentStreamingImageUrl}
  {isFetching}
  {isGenerating}
/>

<div class="sticky bottom-0 bg-base-200">
  <div class="mt-2">
    <ScrollToBottom />
  </div>

  <MessageInput
    bind:input={prompt}
    bind:files
    {isFetching}
    stickyFooter={true}
    onsend={submitForm}
    bind:selectedPromptTool
    bind:isDisablePromptTool
  />
</div>
