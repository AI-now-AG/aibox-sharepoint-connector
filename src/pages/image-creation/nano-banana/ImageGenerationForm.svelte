<script lang="ts">
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import { MessageRole, type Message } from "$types/MessageHistory";
  import { readFileContent } from "$utils/fileReader";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import MessageInput from "$components/chat-ui/MessageInput.svelte";
  import MessageList from "$components/chat-ui/MessageList.svelte";
  import { tenant, user } from "$stores";
  import {
    nanoBananaImageMessageHistory,
    nanoBananaImageFiles,
    nanoBananaImagePreviousResponseId,
  } from "$stores/nanoBananaImageMessageHistory";
  import {
    markdownToHtml,
    stripMarkdownFormatting,
  } from "$utils/textFormatting";
  import { ModelName, PromptToolOption } from "$types/AIProvider";
  import { ApiKeyProvider } from "$types/TenantFeature";

  interface StreamingState {
    messageContent: string;
    citations: any[];
    currentImageUrl: string;
  }

  interface APIConfiguration {
    apiKey: string;
    apiUrl: string;
  }

  interface RequestPayload {
    tenantId: string;
    provider: string;
    prompt: string;
    stream: boolean;
    tool?: string;
    fileUrls: string[];
    previousResponseId?: string | null;
    messageHistory?: Message[];
    reasoningEffort?: string;
    promptTool?: string;
    verbosity?: string;
    model?: string;
  }

  const t = useTranslations();

  // Reactive form state
  let input: string = $state("");
  let currentMessage = $state("");
  let currentStreamingImageUrl: string = $state("");
  let isFetching: boolean = $state(false);
  let isGenerating: boolean = $state(false);
  let previousResponseId: string | null = $state(null);

  let files: File[] = $state([]);

  // Restore files, and previousResponseId on mount
  onMount(() => {
    if ($nanoBananaImageFiles && $nanoBananaImageFiles.length > 0) {
      files = [...$nanoBananaImageFiles];
    }

    if ($nanoBananaImagePreviousResponseId) {
      previousResponseId = $nanoBananaImagePreviousResponseId;
    }
  });

  // Save files, and previousResponseId whenever they change
  $effect(() => {
    $nanoBananaImageFiles = files;
    $nanoBananaImagePreviousResponseId = previousResponseId;
  });

  // === API Configuration ===
  async function getAPIConfiguration(): Promise<APIConfiguration> {
    const configResponse = await fetch(
      "/.netlify/functions/getTranscriptionConfig",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!configResponse.ok) {
      throw new Error("Failed to get transcription configuration");
    }

    const { apiKey, apiUrl: baseUrl } = await configResponse.json();
    return {
      apiKey,
      apiUrl: `${baseUrl}/api/prompt/execute`,
    };
  }

  // === Request Builder ===
  function buildRequestPayload(fileUrls: string[]): RequestPayload {
    isGenerating = true;

    const promptForAttachedFilesOnly = fileUrls.length > 0 ? " " : "";

    const payload: RequestPayload = {
      tenantId: $tenant?._id?.toString()!,
      provider: ApiKeyProvider.Gemini,
      model: ModelName.Gemini25FlashImage,
      prompt: input || promptForAttachedFilesOnly,
      stream: true,
      fileUrls,
      previousResponseId: previousResponseId,
      tool: PromptToolOption.Image,
    };

    return payload;
  }

  // === Image Processing Utilities ===
  function formatImageUrl(imageData: string): string {
    if (!imageData) return "";

    if (imageData.startsWith("data:") || imageData.startsWith("http")) {
      return imageData;
    }

    return `data:image/png;base64,${imageData}`;
  }

  function extractImageFromData(data: any): string {
    return data.result || data.image || "";
  }

  // === Stream Event Handlers ===
  function handleStartEvent(data: any): void {
    console.log(`🚀 Started with ${data.provider} using ${data.model}`);
  }

  function handleChunkEvent(data: any, state: StreamingState): void {
    if (data.content && typeof data.content === "string") {
      state.messageContent += data.content;
      currentMessage += data.content;
      if (data.content.includes("\n")) {
        currentMessage = markdownToHtml(state.messageContent);
      }
    }
  }

  function handleImagesEvent(data: any, state: StreamingState): void {
    console.log("🖼️ Images generated:", data.images?.length || 0);

    if (data.images && data.images.length > 0) {
      const firstImage = data.images[0];
      const imageData = extractImageFromData(firstImage);

      if (imageData) {
        const formattedUrl = formatImageUrl(imageData);
        state.currentImageUrl = formattedUrl;
        currentStreamingImageUrl = formattedUrl;
      }
    }
  }

  function handleToolOutputsEvent(data: any, state: StreamingState): void {
    console.log("🔧 Tool outputs received:", data.outputs.length);

    data.outputs.forEach((output: any) => {
      if (output.image || output.result) {
        const imageData = extractImageFromData(output);
        if (imageData && !state.currentImageUrl) {
          const formattedUrl = formatImageUrl(imageData);
          state.currentImageUrl = formattedUrl;
          currentStreamingImageUrl = formattedUrl;
        }
      }
    });
  }

  function handleCompleteEvent(
    data: any,
    state: StreamingState,
    requestBody: RequestPayload,
    fileUrls?: string[],
  ): any {
    console.log(`✅ Complete! Processing time: ${data.processingTimeMs}ms`);
    if (data.responseId) {
      console.log(`Response ID: ${data.responseId}`);
    }

    const finalImageUrl = formatImageUrl(
      state.currentImageUrl ||
        data.images?.[0]?.result ||
        data.images?.[0]?.image ||
        "",
    );

    const responseText =
      data.fullResponse ?? data.outputText ?? state.messageContent ?? "";

    // Add user message to history
    const newUserMessage: Message = {
      role: MessageRole.User,
      content: requestBody.prompt,
      fileUrls: fileUrls,
    };
    nanoBananaImageMessageHistory.update((messages) => [
      ...messages,
      newUserMessage,
    ]);

    // Handle assistant message
    addAssistantMessage(responseText, finalImageUrl);

    // Clean up and reset states
    resetUIState();
    previousResponseId = data.responseId;

    // Scroll to latest message
    setTimeout(() => scrollIntoView(), 1000);

    return data;
  }

  function handleErrorEvent(
    data: any,
    requestBody: RequestPayload,
    fileUrls?: string[],
  ): void {
    console.error(`❌ Stream error: ${data.error}`);

    const errorMessage = data.error || "Image generation failed.";

    // Add user message to history
    const errorUserMessage: Message = {
      role: MessageRole.User,
      content: requestBody.prompt,
      fileUrls: fileUrls,
    };
    nanoBananaImageMessageHistory.update((messages) => [
      ...messages,
      errorUserMessage,
    ]);

    const failedMessage: Message = {
      role: MessageRole.Assistant,
      content: errorMessage,
    };
    nanoBananaImageMessageHistory.update((messages) => [
      ...messages,
      failedMessage,
    ]);

    addToast({
      message: errorMessage,
      type: "error",
    });

    resetUIState();
    throw new Error(data.error);
  }

  function addAssistantMessage(responseText: string, imageUrl: string): void {
    const newAssistantMessage: Message = {
      role: MessageRole.Assistant,
      content: responseText,
      rawData: stripMarkdownFormatting(responseText),
      imageUrl,
    };

    nanoBananaImageMessageHistory.update((messages) => [
      ...messages,
      newAssistantMessage,
    ]);
  }

  // === State Management Utilities ===
  function resetStreamingState(): void {
    currentMessage = "";
    currentStreamingImageUrl = "";
  }

  function resetUIState(): void {
    input = "";
    files = [];
    currentMessage = "";
    currentStreamingImageUrl = "";
    isFetching = false;
    isGenerating = false;
  }

  // === Stream Processing ===
  function parseStreamLine(line: string): any | null {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith("data: ")) {
      return null;
    }

    const jsonStr = trimmedLine.substring(6).trim();

    // Skip empty data lines or completion markers
    if (!jsonStr || jsonStr === "[DONE]" || jsonStr === "") {
      return null;
    }

    // Basic validation: check if string looks like JSON
    if (!jsonStr.startsWith("{") && !jsonStr.startsWith("[")) {
      return null;
    }

    try {
      return JSON.parse(jsonStr);
    } catch (parseError) {
      return null;
    }
  }

  function processStreamEvent(
    data: any,
    state: StreamingState,
    requestBody: RequestPayload,
    fileUrls?: string[],
  ): any {
    switch (data.type) {
      case "start":
        handleStartEvent(data);
        break;

      case "chunk":
        handleChunkEvent(data, state);
        break;

      case "images":
        handleImagesEvent(data, state);
        break;

      case "tool_outputs":
        handleToolOutputsEvent(data, state);
        break;

      case "complete":
        return handleCompleteEvent(data, state, requestBody, fileUrls);

      case "error":
        handleErrorEvent(data, requestBody, fileUrls);
        break;

      default:
        console.warn(`Unknown event type: ${data.type}`);
    }

    return null;
  }

  async function processStream(
    reader: ReadableStreamDefaultReader,
    requestBody: RequestPayload,
    fileUrls: string[],
  ): Promise<any> {
    const decoder = new TextDecoder();
    let buffer = "";

    const state: StreamingState = {
      messageContent: "",
      citations: [],
      currentImageUrl: "",
    };

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log("✅ Stream completed");
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Process complete lines from buffer
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep the last line in buffer (might be incomplete)

      for (const line of lines) {
        const data = parseStreamLine(line);
        if (data) {
          const result = processStreamEvent(data, state, requestBody, fileUrls);
          if (result) {
            return result; // Return on completion
          }
        }
      }
    }
  }

  // === Main API Function ===
  async function callStreamingAPI(fileUrls: string[] = []) {
    try {
      resetStreamingState();

      const config = await getAPIConfiguration();
      const requestBody = buildRequestPayload(fileUrls);

      const accessToken = $user?.auth0_access_token;
      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 401) {
        addToast({
          message: t("auth.session-missing-force-login"),
          type: "error",
        });
        setTimeout(() => {
          window.location.href = "/api/logout";
        }, 2000);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        console.log("📡 Streaming response received");

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No reader available");
        }

        input = "";
        return await processStream(reader, requestBody, fileUrls);
      }
    } catch (error) {
      console.error("❌ Request failed:", error);
      resetUIState();
      throw error;
    }
  }

  async function submitForm() {
    const fileDataList = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        content: await readFileContent(file),
        type: file.type,
        size: file.size,
      })),
    );

    // reset states
    isFetching = true;
    isGenerating = false;

    let uploadedFileUrls = [];
    if (fileDataList.length > 0) {
      const uploadResponse = await fetch("/.netlify/functions/blobFileUpload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: fileDataList,
          folderName: $tenant?.org_name || "general",
        }),
      });

      const uploadData = await uploadResponse.json();
      uploadedFileUrls = uploadData.results;
    }

    await callStreamingAPI((uploadedFileUrls as string[]) || []);
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

  function startNewChat() {
    input = "";
    files = [];
    isFetching = false;
    previousResponseId = null;
    $nanoBananaImageMessageHistory = [];
    $nanoBananaImageFiles = [];
    $nanoBananaImagePreviousResponseId = null;

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
</script>

<div class="grid grid-cols-1 grid-rows-[1fr_min-content] space-y-6 h-full">
  <div class="flex flex-col space-y-6">
    <h1 class="pt-2 mb-2 lg:pt-8 text-4xl font-bold">
      {t("create-image.create-nano-banana-image-title")}
    </h1>
    <p class="m-0">{t("create-image.create-nano-banana-image-description")}</p>

    <!-- Output (Follow-Up) -->
    {#if $nanoBananaImageMessageHistory.length > 0}
      <MessageList
        messages={$nanoBananaImageMessageHistory}
        {isFetching}
        {isGenerating}
        currentMessage={""}
      />
    {/if}

    <!-- Prompt Textarea -->
    <div
      class={`mt-8  ${$nanoBananaImageMessageHistory.length > 0 ? "sticky bottom-0 bg-base-200" : ""}`}
      transition:slide={{ duration: 500 }}
    >
      {#if $nanoBananaImageMessageHistory.length > 0}
        <div class="my-4">
          <button
            onclick={startNewChat}
            class="btn btn-active btn-primary btn-sm px-8"
            disabled={isFetching}
          >
            {t("home.new-chat")}
          </button>
        </div>

        <ScrollToBottom />
      {/if}

      <MessageInput
        bind:input
        bind:files
        {isFetching}
        stickyFooter={$nanoBananaImageMessageHistory.length > 0}
        onsend={submitForm}
      />
    </div>

    <!-- Output (Normal) -->
    {#if $nanoBananaImageMessageHistory.length == 0}
      <MessageList
        messages={$nanoBananaImageMessageHistory}
        {isFetching}
        {isGenerating}
        currentMessage={""}
      />
    {/if}
  </div>
</div>
