<script lang="ts">
  import { PromptToolOption } from "$types/AIProvider";
  import { type MessageHistory } from "$types/MessageHistory";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import MessageInput from "$components/chat-ui/MessageInput.svelte";
  import MessageList from "$components/chat-ui/MessageList.svelte";

  interface Props {
    conversationId: string;
    messages: MessageHistory;
    promptData: any;
  }

  let { conversationId, messages, promptData }: Props = $props();

  let input: string = $state("");
  let files: File[] = $state([]);
  let currentMessage = $state("");
  let currentStreamingImageUrl: string = $state("");
  let isFetching: boolean = $state(false);
  let isGenerating: boolean = $state(false);

  let selectedPromptTool = $state(PromptToolOption.None);
  let isDisablePromptTool = $state(false);

  async function submitForm() {}
</script>

<div class="grid grid-cols-1 grid-rows-[1fr_min-content] h-full">
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
        toolOptions={[]}
        bind:selectedPromptTool
        bind:isDisablePromptTool
        showDataLossWarning={false}
      />
    </div>

  </div>
</div>
