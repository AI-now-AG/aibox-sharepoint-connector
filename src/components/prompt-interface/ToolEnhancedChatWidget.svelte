<script lang="ts">
  import { onDestroy } from "svelte";
  import { v4 as uuidv4 } from "uuid";
  import { sharedMessageHistory } from "$stores/chatHistory";
  import { type Message } from "$types/MessageHistory";
  import { ResponseStatus, ToolName } from "$types/AIResponse";
  import { PromptModel } from "$types/PromptModel";
  import { addToast } from "$stores/toast";
  import { MessageRole, type MessageHistory } from "$types/MessageHistory";
  import { readFileContent } from "$utils/fileReader";
  import { formatMarkdown } from "$utils/common";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import MessageInput, {
    type Tool,
  } from "$components/chat-ui/MessageInput.svelte";
  import MessageList from "$components/chat-ui/MessageList.svelte";
  import { tenant } from "$stores";

  interface Props {
    currentPrompt: any;
    isFetching: boolean;
  }
  let { currentPrompt, isFetching = $bindable(false) }: Props = $props();

  let enabledTools = $derived.by(() => {
    const tools: Tool[] = [];

    switch (currentPrompt?.model) {
      case PromptModel.OpenAIWithTools:
        tools.push({
          name: "image",
          active: false,
        });
        break;
      case PromptModel.OpenAIWithImageTools:
        tools.push({
          name: "image",
          active: true,
          disabled: true,
        });
        break;
    }

    return tools;
  });

  const tenantId = $tenant?._id?.toString();

  // Reactive form state
  let uniqueId: string = $state("");
  let prompt: string = $state("");
  let files: File[] = $state([]);

  let isGenerating: boolean = $state(false);

  let previousResponseId: string | null = $state(null);

  $effect(() => {
    if (currentPrompt) {
      prompt = currentPrompt?.predefined_input ?? "";
      files = [];
    }
  });

  onDestroy(function () {
    $sharedMessageHistory = [];
  });

  async function submitForm() {
    uniqueId = uuidv4();

    const fileDataList = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        content: await readFileContent(file),
        type: file.type,
      })),
    );

    // reset states
    isFetching = true;
    isGenerating = false;

    const primaryTool =
      enabledTools.length && enabledTools[0].active
        ? enabledTools[0].name
        : undefined;
    const params: Record<string, unknown> = {
      tenantId,
      uniqueId,
      prompt,
      instructions: currentPrompt.prompt ?? "",
      ...(primaryTool && { tool: primaryTool }),
      previousResponseId,
    };
    console.log("Submitting payload:", params);

    if (fileDataList.length > 0) {
      const uploadResponse = await fetch("/.netlify/functions/blobFileUpload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: fileDataList,
        }),
      });

      const uploadData = await uploadResponse.json();
      params["files"] = uploadData.results;
    }

    const response = await fetch(
      "/.netlify/functions/createResponse-background",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      },
    );

    if (response.status !== 202) {
      addToast({
        message: "Failed to start image generation.",
        type: "error",
      });
      isFetching = false;
      return;
    }

    // start polling requests
    setTimeout(async () => {
      await pollResponseStatus(uniqueId);
    }, 2000);
  }

  async function pollResponseStatus(
    uniqueId: string,
    maxRetries = 100,
    delayMs = 2000,
  ) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const res = await fetch(
        `/.netlify/functions/checkResponseStatus?uid=${uniqueId}`,
      );
      const data = await res.json();

      if (data.status === ResponseStatus.InProgress) {
        const isGenerated =
          data.tools.find((item: any) => item.name === ToolName.Image)
            ?.is_generated ?? true;
        isGenerating = !isGenerated;
      }

      if (data.status === ResponseStatus.Completed) {
        const imageUrl =
          data.tools.find((item: any) => item.name === ToolName.Image)
            ?.image_url || "";

        // store messages
        sharedMessageHistory.update((messages: Message[]) => [
          ...messages,
          {
            role: MessageRole.User,
            content: prompt,
          },
        ]);

        sharedMessageHistory.update((messages: Message[]) => [
          ...messages,
          {
            role: MessageRole.Assistant,
            content: formatMarkdown(data.outputText ?? ""),
            imageUrl,
          },
        ]);

        // scroll to latest user input
        setTimeout(() => {
          scrollIntoView();
        }, 1000);

        // clear input text & files
        prompt = "";
        files = [];

        // reset states
        previousResponseId = data.responseId;
        isFetching = false;
        isGenerating = false;
        return;
      } else if (data.status === ResponseStatus.Failed) {
        const errorMessage = data.error?.message || "Image generation failed.";
        $sharedMessageHistory.push({
          role: MessageRole.Assistant,
          content: errorMessage,
        });
        addToast({
          message: errorMessage,
          type: "error",
        });

        isFetching = false;
        isGenerating = false;
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    addToast({
      message: "Image generation timed out.",
      type: "error",
    });
    isFetching = false;
  }

  function scrollIntoView() {
    const chatBubbles = document?.querySelectorAll(
      ".chat-container > .chat-bubble",
    );
    if (chatBubbles && chatBubbles.length > 0) {
      chatBubbles[chatBubbles.length - 1].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }
</script>

<!-- Output (Follow-Up) -->
{#if $sharedMessageHistory.length > 0}
  <MessageList messages={$sharedMessageHistory} {isFetching} {isGenerating} />
{/if}

<!-- Prompt Textarea -->
<div
  class={`${$sharedMessageHistory.length > 0 ? "sticky bottom-0 bg-base-200" : ""}`}
>
  {#if $sharedMessageHistory.length > 0}
    <ScrollToBottom />
  {/if}

  <MessageInput
    bind:input={prompt}
    bind:files
    {isFetching}
    stickyFooter={$sharedMessageHistory.length > 0}
    bind:tools={enabledTools}
    onsend={submitForm}
  />
</div>

<!-- Output (Normal) -->
{#if $sharedMessageHistory.length == 0}
  <MessageList messages={$sharedMessageHistory} {isFetching} {isGenerating} />
{/if}
