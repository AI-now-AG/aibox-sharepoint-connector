<script lang="ts">
  import { v4 as uuidv4 } from "uuid";
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
    stripHtmlFormatting,
  } from "$utils/textFormatting";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import MessageInput from "$components/chat-ui/MessageInput.svelte";
  import MessageList from "$components/chat-ui/MessageList.svelte";
  import { tenant, user } from "$stores";
  import { useTranslations } from "$i18n/utils";
  import { ApiKeyProvider } from "$types/TenantFeature";
  import { PromptToolOption } from "$types/AIProvider";
  import { getPromptTools, useProviderInfo } from "$shared/AIProvider";

  const t = useTranslations();

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
    promptId: string;
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
  let uniqueId: string = $state("");
  let prompt: string = $state("");
  let files: File[] = $state([]);
  let currentStreamingImageUrl: string = $state("");
  let isGenerating: boolean = $state(false);
  let isResoningThingking: boolean = $state(false);

  function isGpt5Default() {
    const aiProviders = $tenant?.api_key_providers ?? [];
    const activeDefaultProvider = aiProviders.find(
      (item) => item.active === true && item.default === true,
    );

    if (activeDefaultProvider?.name === ApiKeyProvider.OpenAIGtp5) {
      return true;
    }
    return false;
  }

  function getDefaultModelName() {
    const aiProviders = $tenant?.api_key_providers ?? [];
    const activeDefaultProvider = aiProviders.find(
      (item) => item.active === true && item.default === true,
    );
    return activeDefaultProvider?.name || ApiKeyProvider.OpenAI;
  }

  const providerIno = useProviderInfo($tenant);
  // === Derived State ===
  let toolOptions = $derived.by(() => {
    return getPromptTools(
      (currentPrompt?.model == PromptModel.Default
        ? providerIno?.defaultProviderPromptModelName == PromptModel.OpenAI
          ? PromptModel.OpenAIWithTools
          : providerIno?.defaultProviderPromptModelName
        : currentPrompt?.model) as PromptModel,
    );
  });

  let selectedPromptTool = $state(PromptToolOption.None);
  let isDisablePromptTool = $state(false);

  // === Effects ===
  $effect(() => {
    if (currentPrompt.promptTool != PromptToolOption.None) {
      selectedPromptTool = currentPrompt.promptTool;
    }
    // Support Old gpt-image selection (active image tool by default)
    const isOpenAiWithImageTool =
      currentPrompt.model == PromptModel.OpenAIWithImageTools;
    if (isOpenAiWithImageTool) {
      selectedPromptTool = PromptToolOption.Image;
    }
    if (
      (currentPrompt.promptTool &&
        currentPrompt.promptTool != PromptToolOption.None) ||
      isOpenAiWithImageTool
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

  // === Effects ===
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
    let isOpenAIResponseModel =
      [
        PromptModel.OpenAI,
        PromptModel.OpenAIWithTools,
        PromptModel.OpenAIWithImageTools,
      ].includes(currentPrompt?.model) ||
      (getDefaultModelName() == ApiKeyProvider.OpenAI && !currentPrompt?.model);

    const isOpenAIGpt5ResponseModel =
      [PromptModel.OpenAIGpt5].includes(currentPrompt?.model) ||
      (isGpt5Default() && !currentPrompt?.model);

    const provider = isOpenAIResponseModel
      ? "openai-response"
      : isOpenAIGpt5ResponseModel
        ? "openai-gpt-5-response"
        : currentPrompt?.model || getDefaultModelName();

    const promptForAttachedFilesOnly = fileUrls.length > 0 ? " " : "";

    const payload: RequestPayload = {
      tenantId: tenantId!,
      provider,
      prompt: prompt || promptForAttachedFilesOnly,
      promptId,
      stream: true,
      fileUrls,
    };

    // Add conditional properties
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

    if (isOpenAIResponseModel) {
      payload.previousResponseId = previousResponseId;
    } else {
      payload.messageHistory = currentMessageHistory;
    }

    if (isOpenAIGpt5ResponseModel) {
      payload.reasoningEffort = currentPrompt?.reasoningEffort || "low";
      payload.verbosity = currentPrompt?.textVerbosity || "low";
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

    return data;
  }

  function handleErrorEvent(data: any, requestBody: RequestPayload): void {
    console.error(`❌ Stream error: ${data.error}`);

    const errorMessage = data.error || "Image generation failed.";

    // Add user message to history
    const errorUserMessage: Message = {
      role: MessageRole.User,
      content: requestBody.prompt,
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

    const formattedText = buildCitationLinks(responseText, citations);
    currentMessage = markdownToHtml(formattedText);

    const newAssistantMessage: Message = {
      role: MessageRole.Assistant,
      content: currentMessage,
      rawData: stripHtmlFormatting(currentMessage),
      imageUrl,
    };

    addMessageToHistory(groupId, promptId, newAssistantMessage);
  }

  function addAssistantMessage(responseText: string, imageUrl: string): void {
    const newAssistantMessage: Message = {
      role: MessageRole.Assistant,
      content: markdownToHtml(responseText),
      rawData: stripHtmlFormatting(responseText),
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
  ): any {
    switch (data.type) {
      case "start":
        if (data.model === "gpt-5") {
          isResoningThingking = true;
        }
        handleStartEvent(data);
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
        return handleCompleteEvent(data, state, requestBody);

      case "error":
        handleErrorEvent(data, requestBody);
        break;

      default:
        console.warn(`Unknown event type: ${data.type}`);
    }

    return null;
  }

  async function processStream(
    reader: ReadableStreamDefaultReader,
    requestBody: RequestPayload,
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
            processStreamEvent(data, state, requestBody);
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
          const result = processStreamEvent(data, state, requestBody);
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
      const accessToken = $user?.auth0_access_token;
      if (!accessToken) {
        addToast({
          message: t('auth.session-missing-force-login'),
          type: "error",
        });
        setTimeout(() => {
          window.location.href = "/api/logout";
        }, 2000);
        return;
      }
      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          //"X-API-Key": config.apiKey,
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

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
        return await processStream(reader, requestBody);
      }
    } catch (error) {
      console.error("❌ Request failed:", error);
      resetUIState();
      throw error;
    }
  }

  // === File Upload Handler ===
  async function submitForm() {
    uniqueId = uuidv4();

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

  function persistChatHistory() {
    
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
  />
{/if}

<!-- Prompt Textarea -->
<div
  class={`${currentMessageHistory.length > 0 ? "sticky bottom-0 bg-base-200" : ""}`}
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
        onclick={persistChatHistory}
        class="btn btn-active btn-primary btn-sm px-8"
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
  />
{/if}
