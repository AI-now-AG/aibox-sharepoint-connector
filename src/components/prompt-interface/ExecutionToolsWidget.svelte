<script lang="ts">
  import { v4 as uuidv4 } from "uuid";
  import { useTranslations } from "$i18n/utils";
  import { ResponseStatus, ToolName } from "$types/AIResponse";
  import { addToast } from "$stores/toast";
  import { MessageRole, type MessageHistory } from "$types/MessageHistory";
  import { readFileContent } from "$utils/fileReader";
  import { formatMarkdown, capitalizeFirst } from "$utils/common";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import MessageInput from "$components/chat-ui/MessageInput.svelte";
  import MessageList from "$components/chat-ui/MessageList.svelte";
  import { tenant } from "$stores";

  interface Props {
    promptId: string;
    currentPrompt: any;
    isProcessing: boolean;
  }
  let {
    promptId = "",
    currentPrompt,
    isProcessing = $bindable(false),
  }: Props = $props();

  const t = useTranslations();
  const tenantId = $tenant?._id?.toString();

  // Reactive form state
  let uniqueId: string = $state("");
  let prompt: string = $state("");
  let files: File[] = $state([]);

  let messages: MessageHistory = $state([]);
  let isFetching: boolean = $state(false);
  let isGenerating: boolean = $state(false);
  let previousResponseId: string | null = $state(null);

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

    const params: Record<string, unknown> = {
      tenantId,
      uniqueId,
      prompt,
      previousResponseId,
    };
    console.log("Submitting payload:", params);

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

    const response = await fetch(
      "/.netlify/functions/createResponseImage-background",
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
      await pollImageStatus(uniqueId);
    }, 2000);
  }

  async function pollImageStatus(
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
        messages.push({
          role: MessageRole.User,
          content: prompt,
        });
        messages.push({
          role: MessageRole.Assistant,
          content: formatMarkdown(data.outputText),
          imageUrl,
        });

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
        messages.push({
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
{#if messages.length > 0}
  <MessageList {messages} {isFetching} {isGenerating} />
{/if}

<!-- Prompt Textarea -->
<div class={`${messages.length > 0 ? "sticky bottom-0 bg-base-200" : ""}`}>
  {#if messages.length > 0}
    <ScrollToBottom />
  {/if}

  <MessageInput
    bind:input={prompt}
    bind:files
    {isFetching}
    stickyFooter={messages.length > 0}
    onsend={submitForm}
  />
</div>

<!-- Output (Normal) -->
{#if messages.length == 0}
  <MessageList {messages} {isFetching} {isGenerating} />
{/if}
