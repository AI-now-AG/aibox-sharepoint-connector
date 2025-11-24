<script lang="ts">
  import { actions } from "astro:actions";
  import {
    messageHistories,
    addMessageToHistory,
    getMessageHistory,
    clearMessageHistory,
    previousResponseIds,
    setPreviousResponseId,
    getPreviousResponseId,
  } from "$components/prompt-interface/components/stores/messageHistoryStore";
  import { PromptModel } from "$types/PromptModel";
  import { addToast } from "$stores/toast";
  import {
    MessageRole,
    type Message,
    type MessageHistory,
  } from "$types/MessageHistory";
  import { readFileContent } from "$utils/fileReader";
  import {
    markdownToHtml,
    buildCitationLinks,
    stripMarkdownFormatting,
  } from "$utils/textFormatting";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import MessageInput from "$components/chat-ui/MessageInput.svelte";
  import MessageList from "$components/chat-ui/MessageList.svelte";
  import Loading from "$components/Loading.svelte";
  import { tenant, user } from "$stores";
  import { useTranslations } from "$i18n/utils";
  import {
    ModelName,
    PromptToolOption,
    ReasoningEffortOption,
    TextVerbosityOption,
  } from "$types/AIProvider";
  import {
    getPromptTools,
    useProviderInfo,
    NanoBananaPromptTools,
    resolveAPIProvider,
    getModelName,
  } from "$shared/AIProvider";
  import { TRANSCRIPTION_API_URL } from "astro:env/client";
  import { EventName, ScreenName } from "$types/Posthog";
  import { posthogClientCapture } from "$utils/posthogClient";

  const t = useTranslations();

  interface StreamingState {
    messageContent: string;
    citations: any[];
    currentImageUrl: string;
  }

  interface APIConfiguration {
    apiUrl: string;
    accessToken: string;
  }

  interface RequestPayload {
    tenantId: string;
    provider: string;
    prompt: string;
    promptId: string;
    model?: string;
    stream: boolean;
    tool?: string;
    fileUrls: string[];
    imageGenerationOptions?: any;
    previousResponseId?: string | null;
    messageHistory?: MessageHistory;
    reasoningEffort?: string;
    verbosity?: string;
  }

  interface Props {
    promptId: string;
    groupId: string;
    currentPrompt: any;
    isFetching: boolean;
    folderName?: string;
  }
  let {
    promptId,
    groupId,
    currentPrompt,
    isFetching = $bindable(false),
    folderName,
  }: Props = $props();

  // === State Management ===
  let currentMessage = $state("");
  let currentMessageHistory = $derived(
    $messageHistories[promptId] || getMessageHistory(promptId) || [],
  );
  let prompt: string = $state("");
  let files: File[] = $state([]);
  let currentStreamingImageUrl: string = $state("");
  let isGenerating: boolean = $state(false);
  let isResoningThingking: boolean = $state(false);
  let loading: boolean = $state(false);

  // let isShowAttachmentButton = $state(
  //   currentPrompt?.model != PromptModel.Perplexity,
  // );
  let isShowAttachmentButton = $state(true);

  $effect(() => {
    //isShowAttachmentButton = currentPrompt?.model != PromptModel.Perplexity;
  });

  const providerInfo = useProviderInfo($tenant);
  // === Derived State ===
  let toolOptions = $derived.by(() => {
    if (currentPrompt?.model == PromptModel.NanoBanana) {
      return NanoBananaPromptTools;
    }

    return getPromptTools(
      (currentPrompt?.model == PromptModel.Default
        ? providerInfo?.defaultProviderPromptModelName
        : currentPrompt?.model) as PromptModel,
    );
  });

  let selectedPromptTool = $state(PromptToolOption.Image);
  let isDisablePromptTool = $state(false);

  // Apply prompt’s tool if specified
  $effect(() => {
    if (currentPrompt?.promptTool != PromptToolOption.None) {
      selectedPromptTool = currentPrompt?.promptTool;
    }
  });

  // Disable tool switching if prompt has a tool or model is NanoBanana
  $effect(() => {
    if (
      (currentPrompt?.promptTool &&
        currentPrompt?.promptTool != PromptToolOption.None) ||
      currentPrompt?.model == PromptModel.NanoBanana
    ) {
      isDisablePromptTool = true;
    } else {
      isDisablePromptTool = false;
    }
  });

  const tenantId = $tenant?._id?.toString();
  let previousResponseId: string | null = $derived(
    $previousResponseIds[promptId] ?? getPreviousResponseId(promptId),
  );

  // Reset prompt and files when prompt changes
  $effect(() => {
    if (currentPrompt) {
      if (previousResponseId) {
        prompt = "";
        files = [];
      } else {
        prompt = currentPrompt?.predefined_input ?? "";
        files = [];
      }
    }
  });

  // Auto-select Image tool for NanoBanana prompts
  $effect(() => {
    if (currentPrompt) {
      if (currentPrompt?.model == PromptModel.NanoBanana) {
        selectedPromptTool = PromptToolOption.Image;
      }
    }
  });

  // === API Configuration ===
  async function getAPIConfiguration(): Promise<APIConfiguration> {
    return {
      apiUrl: `${TRANSCRIPTION_API_URL}/api/prompt/execute`,
      accessToken: $user?.api_token as string,
    };
  }

  // === Request Builder ===
  function buildRequestPayload(fileUrls: string[]): RequestPayload {
    let isResponseModel = [
      PromptModel.OpenAI,
      PromptModel.OpenAIWithTools, // Deprecated — removal imminent
      PromptModel.OpenAIWithImageTools, // Deprecated — removal imminent
      PromptModel.OpenAIGpt5,
    ].includes(currentPrompt?.model);

    const isGeminiImageModel = [PromptModel.NanoBanana].includes(
      currentPrompt?.model,
    );

    const provider: any = resolveAPIProvider(
      currentPrompt?.model,
      providerInfo?.defaultProviderPromptModelName as unknown as
        | PromptModel
        | undefined,
    );
    const requestModel = isGeminiImageModel
      ? ModelName.Gemini25FlashImage
      : undefined;

    const promptForAttachedFilesOnly = fileUrls.length > 0 ? " " : "";

    const payload: RequestPayload = {
      tenantId: tenantId!,
      provider,
      model: requestModel,
      prompt: prompt || promptForAttachedFilesOnly,
      promptId,
      stream: true,
      fileUrls,
    };

    if (selectedPromptTool != PromptToolOption.None) {
      payload.tool = selectedPromptTool;
      if (selectedPromptTool == PromptToolOption.Image) {
        payload.imageGenerationOptions = {
          outputFormat: "png",
          quality: "medium",
          size: "1024x1024",
          background: "auto",
        };
      }
    }

    if (isResponseModel) {
      payload.previousResponseId = previousResponseId;
      payload.reasoningEffort =
        currentPrompt?.reasoningEffort || ReasoningEffortOption.Low;
      payload.verbosity =
        currentPrompt?.textVerbosity || TextVerbosityOption.Low;
    } else {
      payload.messageHistory = currentMessageHistory;
    }

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

      // If the current chunk contains a newline,
      // re-render the entire accumulated text as HTML.
      // This avoids trying to parse on every single character
      // and ensures we only re-render when a natural "block" ends.
      if (data.content.includes("\n")) {
        currentMessage = markdownToHtml(state.messageContent);
      }
    }
  }

  function handleCitationsEvent(data: any, state: StreamingState): void {
    if (data.citations && data.citations.length > 0) {
      console.log("📚 Citations received:", data.citations.length);
      state.citations = data.citations;
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
    addMessageToHistory(groupId, promptId, newUserMessage);

    // Handle assistant message with citations
    if (state.citations.length > 0) {
      addAssistantMessageWithCitations(
        responseText,
        state.citations,
        finalImageUrl,
      );
    } else {
      addAssistantMessage(responseText, finalImageUrl);
    }

    // Clean up and reset states
    resetUIState();
    setPreviousResponseId(promptId, data.responseId);

    // Scroll to latest message
    setTimeout(() => scrollIntoView(), 1000);

    posthogClientCapture($tenant, EventName.AiboxPromptResult, {
      use_case: currentPrompt?.title || "-",
      tool: selectedPromptTool,
      model: getModelName($tenant, currentPrompt?.model),
      page_name: ScreenName.PromptExecutionArea,
    });

    return data;
  }

  function handleErrorEvent(
    data: any,
    requestBody: RequestPayload,
    fileUrls?: string[],
  ): void {
    console.error(`❌ Stream error: ${data.error}`);

    const errorMessage = data.error || "Text generation request failed.";

    // Add user message to history
    const errorUserMessage: Message = {
      role: MessageRole.User,
      content: requestBody.prompt,
      fileUrls: fileUrls,
    };
    addMessageToHistory(groupId, promptId, errorUserMessage);

    const failedMessage: Message = {
      role: MessageRole.Assistant,
      content: errorMessage,
    };
    addMessageToHistory(groupId, promptId, failedMessage);

    addToast({
      message: errorMessage,
      type: "error",
    });

    resetUIState();
    throw new Error(data.error);
  }

  // === Message History Utilities ===
  function addAssistantMessageWithCitations(
    responseText: string,
    citations: any[],
    imageUrl: string,
  ): void {
    console.log("📚 Citations sent:", citations);

    const markdownWithLinks = buildCitationLinks(responseText, citations);

    const newAssistantMessage: Message = {
      role: MessageRole.Assistant,
      content: markdownWithLinks,
      rawData: stripMarkdownFormatting(markdownWithLinks),
      imageUrl,
    };

    addMessageToHistory(groupId, promptId, newAssistantMessage);
  }

  function addAssistantMessage(responseText: string, imageUrl: string): void {
    const newAssistantMessage: Message = {
      role: MessageRole.Assistant,
      content: responseText,
      rawData: stripMarkdownFormatting(responseText),
      imageUrl,
    };

    addMessageToHistory(groupId, promptId, newAssistantMessage);
  }

  // === State Management Utilities ===
  function resetStreamingState(): void {
    currentMessage = "";
    currentStreamingImageUrl = "";
  }

  function resetUIState(): void {
    prompt = "";
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

      case "reasoning":
        isResoningThingking = true;
        break;

      case "chunk":
        isResoningThingking = false;
        handleChunkEvent(data, state);
        break;

      case "citations":
        handleCitationsEvent(data, state);
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

        // Process any remaining data in buffer
        if (buffer.trim()) {
          const data = parseStreamLine(buffer);
          if (data) {
            console.log("📥 Processing final buffered data:", data.type);
            processStreamEvent(data, state, requestBody, fileUrls);
          }
        }
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

      // Get API configuration
      const config = await getAPIConfiguration();

      // Build request payload
      const requestBody = buildRequestPayload(fileUrls);

      // Check for image generation tool
      isGenerating = selectedPromptTool == PromptToolOption.Image;

      // Make API request
      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.accessToken}`,
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

      // Process streaming response
      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        console.log("📡 Streaming response received");

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No reader available");
        }

        prompt = ""; // Reset prompt for new request
        return await processStream(reader, requestBody, fileUrls);
      }
    } catch (error) {
      console.error("❌ Request failed:", error);
      resetUIState();
      throw error;
    }
  }

  // === File Upload Handler ===
  async function submitForm() {
    const fileDataList = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        content: await readFileContent(file),
        type: file.type,
        size: file.size,
      })),
    );

    // Reset states
    isFetching = true;
    isGenerating = false;

    setTimeout(() => {
      const thinkingIndicator = document.getElementById("thinking-indicator");
      if (thinkingIndicator) {
        thinkingIndicator.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);

    let uploadedFileUrls = [];
    if (fileDataList.length > 0) {
      const uploadResponse = await fetch("/.netlify/functions/blobFileUpload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: fileDataList,
          folderName: folderName,
        }),
      });

      const uploadData = await uploadResponse.json();
      uploadedFileUrls = uploadData.results;
    }

    await callStreamingAPI((uploadedFileUrls as string[]) || []);
  }

  // === UI Utilities ===
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
    clearMessageHistory(promptId);
    setPreviousResponseId(promptId, null);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveConversation() {
    loading = true;
    const { error, data } = await actions.conversation.save({
      prompt_id: currentPrompt._id?.toString() || "",
      model: currentPrompt.model,
      messages: currentMessageHistory,
      previous_response_id: previousResponseId,
    });
    loading = false;
    if (error) {
      addToast({
        message: error?.message ?? "Something went wrong",
        type: "error",
      });
    } else {
      window.location.href = `/conversations/${data.insertedId}`;
    }
  }
</script>

<!-- Output (Follow-Up) -->
{#if currentMessageHistory.length > 0}
  <MessageList
    {currentMessage}
    messages={currentMessageHistory}
    currentImageUrl={currentStreamingImageUrl}
    {isFetching}
    {isGenerating}
    {isResoningThingking}
    promptResultTrackging={{
      page_name: ScreenName.PromptExecutionArea,
      use_case: currentPrompt?.title || "-",
      tool: selectedPromptTool,
      model: getModelName($tenant, currentPrompt?.model),
    }}
  />
{/if}

<!-- Prompt Textarea -->
<div
  class={`${currentMessageHistory.length > 0 ? "sticky bottom-0 bg-base-200 z-50" : ""}`}
>
  {#if currentMessageHistory.length > 0}
    <div class="my-4">
      <button
        onclick={startNewChat}
        class="btn btn-active btn-primary btn-sm px-8"
        disabled={isGenerating || isFetching}
      >
        {t("home.new-chat")}
      </button>
      <button
        onclick={saveConversation}
        class="btn btn-primary btn-outline btn-sm px-8"
        disabled={isGenerating || isFetching}
      >
        {t("prompt.save-chat")}
      </button>
      <div class="mt-2">
        <ScrollToBottom />
      </div>
    </div>
  {/if}
  <MessageInput
    bind:input={prompt}
    bind:files
    {isFetching}
    stickyFooter={currentMessageHistory.length > 0}
    onsend={submitForm}
    {toolOptions}
    bind:selectedPromptTool
    bind:isDisablePromptTool
    allowFileUpload={isShowAttachmentButton}
  />
</div>

<!-- Output (Normal) -->
{#if currentMessageHistory.length == 0}
  <MessageList
    {currentMessage}
    currentImageUrl={currentStreamingImageUrl}
    messages={currentMessageHistory}
    {isFetching}
    {isGenerating}
    {isResoningThingking}
    promptResultTrackging={{
      page_name: ScreenName.PromptExecutionArea,
      use_case: currentPrompt?.title || "-",
      tool: selectedPromptTool,
      model: getModelName($tenant, currentPrompt?.model),
    }}
  />
{/if}

<Loading show={loading} />
