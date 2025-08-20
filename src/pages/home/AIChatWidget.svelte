<script lang="ts">
  import { onDestroy } from "svelte";
  import { slide } from "svelte/transition";
  import { type Message, MessageRole } from "$types/MessageHistory";
  import { sharedMessageHistory } from "$stores/chatHistory";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import MessageInput, {
    type Tool,
  } from "$components/chat-ui/MessageInput.svelte";
  import MessageList from "$components/chat-ui/MessageList.svelte";
  import { readFileContent } from "$utils/fileReader";
  import { ToolName } from "$types/AIResponse";
  import { PromptModel } from "$types/PromptModel";
  import {
    formatMarkdown,
    parseChunkCitations,
    formatCitations,
    stripHtmlFormatting,
  } from "$utils/common";
  import AIModelDropdown from "./AIModelDropdown.svelte";
  import { tenant, user } from "$stores";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import { ApiKeyProvider } from "$types/TenantFeature";

  const t = useTranslations();

  // === Types and Interfaces ===
  interface StreamingState {
    messageContent: string;
    citations: any[];
    currentImageUrl: string;
    isSentCitations: boolean;
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
    imageGenerationOptions?: any;
    previousResponseId?: string | null;
    messageHistory?: Message[];
    reasoningEffort?: string;
    verbosity?: string;
  }

  interface Props {
    apiKeyProviders: any;
    folderName?: string;
  }
  let { apiKeyProviders = [], folderName }: Props = $props();

  let input: string = $state("");
  let files: File[] = $state([]);
  let selectedModel: PromptModel = $state(PromptModel.OpenAIWithTools);
  let isDisableSelectModel: boolean = $state(false);
  let currentMessage = $state("");
  let currentStreamingImageUrl: string = $state("");
  let isFetching: boolean = $state(false);
  let isGenerating: boolean = $state(false);
  let isResoningThingking: boolean = $state(false);
  let previousResponseId: string | null = $state(null);
  let enabledTools: Tool[] = $state([]);

  const apiProvider = apiKeyProviders?.find((item: any) => {
    return item.default && item.active;
  });
  let isDisableFileInput = $state(apiProvider?.name == PromptModel.Perplexity);

  $effect(() => {
    isDisableSelectModel = $sharedMessageHistory.length > 0 || isFetching;
    isDisableFileInput = selectedModel === PromptModel.Perplexity;
  });

  $effect(() => {
    if (
      [PromptModel.OpenAIWithTools, PromptModel.OpenAIGpt5].includes(
        selectedModel,
      )
    ) {
      enabledTools = [
        {
          name: "image",
          active: false,
        },
      ];
    } else {
      enabledTools = [];
    }
  });

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

  onDestroy(function () {
    //$sharedMessageHistory = [];
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
    const isOpenAIResponseModel = [PromptModel.OpenAIWithTools].includes(
      selectedModel,
    );

    const isOpenAIGpt5ResponseModel =
      [
        PromptModel.OpenAIGpt5,
        PromptModel.OpenAIGpt5WithTools,
        PromptModel.OpenAIGpt5WithImageTools,
      ].includes(selectedModel) ||
      (isGpt5Default() && !selectedModel);

    const provider = isOpenAIResponseModel
      ? "openai-response"
      : isOpenAIGpt5ResponseModel
        ? "openai-gpt-5-response"
        : selectedModel;

    const hasImageTool = enabledTools.some(
      (tool) => tool.name === ToolName.Image && tool.active,
    );

    isGenerating = hasImageTool;

    const payload: RequestPayload = {
      tenantId: $tenant?._id?.toString()!,
      provider,
      prompt: input,
      stream: true,
      fileUrls,
    };

    // Add conditional properties
    if (hasImageTool) {
      payload.tool = "image_generation";
      payload.imageGenerationOptions = {
        outputFormat: "png",
        quality: "medium",
        size: "1024x1024",
        background: "auto",
      };
    }

    if (isOpenAIResponseModel) {
      payload.previousResponseId = previousResponseId;
    } else {
      payload.messageHistory = $sharedMessageHistory;
    }

    if (isOpenAIGpt5ResponseModel) {
      payload.reasoningEffort = "low";
      payload.verbosity = "low";
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

  function handleChunkEvent(data: any): void {
    if (data.content && typeof data.content === "string") {
      currentMessage += data.content;
      currentMessage = formatMarkdown(currentMessage);
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
    sharedMessageHistory.update((messages) => [...messages, newUserMessage]);

    // Handle assistant message with citations
    if (state.citations.length > 0 && !state.isSentCitations) {
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
    previousResponseId = data.responseId;

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
    sharedMessageHistory.update((messages) => [...messages, errorUserMessage]);

    const failedMessage: Message = {
      role: MessageRole.Assistant,
      content: errorMessage,
    };
    sharedMessageHistory.update((messages) => [...messages, failedMessage]);

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

    const citationsJson = JSON.stringify({ citations });
    const parsedChunk: any = parseChunkCitations(citationsJson);

    if (parsedChunk.citations) {
      citations = parsedChunk.citations;
    }

    const formattedChunk = formatMarkdown(responseText)
      .split("\n")
      .map((line) => formatMarkdown(line))
      .join("\n");

    currentMessage = formatCitations(formattedChunk, citations);

    const newAssistantMessage: Message = {
      role: MessageRole.Assistant,
      content: formatMarkdown(currentMessage),
      rawData: stripHtmlFormatting(currentMessage),
      imageUrl,
    };

    sharedMessageHistory.update((messages) => [
      ...messages,
      newAssistantMessage,
    ]);
  }

  function addAssistantMessage(responseText: string, imageUrl: string): void {
    const newAssistantMessage: Message = {
      role: MessageRole.Assistant,
      content: formatMarkdown(responseText),
      rawData: stripHtmlFormatting(responseText),
      imageUrl,
    };

    sharedMessageHistory.update((messages) => [
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
        handleChunkEvent(data);
        state.messageContent += data.content || "";
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
      isSentCitations: false,
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

      // Make API request
      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": config.apiKey,
          "Authorization": `Bearer ${$user?.auth0AccessToken || ""}`,
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

        input = ""; // Reset prompt for new request
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

    let uploadedFileUrls = [];
    if (fileDataList.length > 0) {
      const uploadResponse = await fetch("/.netlify/functions/blobFileUpload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: fileDataList,
          folderName,
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
    input = "";
    files = [];
    isFetching = false;
    isGenerating = false;
    $sharedMessageHistory = [];

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
</script>

<div class="grid grid-cols-1 grid-rows-[1fr_min-content] h-full">
  <div class="flex flex-col space-y-6">
    {#if $sharedMessageHistory.length == 0}
      <div
        class="min-w-full form-wrapper"
        in:slide={{ duration: 500, delay: 500 }}
        out:slide={{ duration: 500 }}
      >
        <MessageInput
          bind:input
          bind:files
          {isFetching}
          bind:tools={enabledTools}
          showAttachmentButton={!isDisableFileInput}
          onsend={submitForm}
        />
      </div>
    {/if}

    <div class="flex items-end justify-end z-10">
      <div>
        <AIModelDropdown
          label={t("home.model-label")}
          bind:selectedModel
          bind:disabled={isDisableSelectModel}
          labelClasses={"text-sm"}
        />
      </div>
    </div>

    <MessageList
      {currentMessage}
      messages={$sharedMessageHistory}
      currentImageUrl={currentStreamingImageUrl}
      {isFetching}
      {isGenerating}
      {isResoningThingking}
    />

    {#if $sharedMessageHistory.length > 0}
      <div
        class="sticky bottom-0 bg-base-200"
        transition:slide={{ duration: 500 }}
      >
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
        <div
          class="min-w-full form-wrapper"
          in:slide={{ duration: 500, delay: 500 }}
          out:slide={{ duration: 500 }}
        >
          <MessageInput
            bind:input
            bind:files
            {isFetching}
            bind:tools={enabledTools}
            stickyFooter={true}
            onsend={submitForm}
          />
        </div>
      </div>
    {/if}
  </div>
</div>
