<script lang="ts">
  import { actions } from "astro:actions";
  import { slide } from "svelte/transition";
  //import { navigate } from "astro:transitions/client";
  import { type Message, MessageRole } from "$types/MessageHistory";
  import { sharedMessageHistory } from "$stores/chatHistory";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import MessageInput from "$components/chat-ui/MessageInput.svelte";
  import MessageList from "$components/chat-ui/MessageList.svelte";
  import Loading from "$components/Loading.svelte";
  import { readFileContent } from "$utils/fileReader";
  import { PromptModel } from "$types/PromptModel";
  import {
    markdownToHtml,
    buildCitationLinks,
    stripMarkdownFormatting,
  } from "$utils/textFormatting";
  import AIModelDropdown from "./AIModelDropdown.svelte";
  import { tenant, user } from "$stores";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import { ApiKeyProvider } from "$types/TenantFeature";
  import { PromptToolOption } from "$types/AIProvider";
  import { getPromptTools, useProviderInfo } from "$shared/AIProvider";

  const t = useTranslations();

  // === Types and Interfaces ===
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
    imageGenerationOptions?: any;
    previousResponseId?: string | null;
    messageHistory?: Message[];
    reasoningEffort?: string;
    promptTool?: string;
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
  let loading: boolean = $state(false);

  const apiProvider = apiKeyProviders?.find((item: any) => {
    return item.default && item.active;
  });
  let isDisableFileInput = $state(apiProvider?.name == PromptModel.Perplexity);

  $effect(() => {
    isDisableSelectModel = $sharedMessageHistory.length > 0 || isFetching;
    isDisableFileInput = selectedModel === PromptModel.Perplexity;
  });

  const providerIno = useProviderInfo($tenant);
  // === Derived State ===
  let toolOptions = $derived.by(() => {
    return getPromptTools(
      (selectedModel == PromptModel.Default
        ? providerIno?.defaultProviderPromptModelName == PromptModel.OpenAI
          ? PromptModel.OpenAIWithTools
          : providerIno?.defaultProviderPromptModelName
        : selectedModel) as PromptModel,
    );
  });

  let selectedPromptTool = $state(PromptToolOption.None);

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
    const isOpenAIResponseModel = [
      PromptModel.OpenAI,
      PromptModel.OpenAIWithTools,
      PromptModel.OpenAIWithImageTools,
    ].includes(selectedModel);

    const isOpenAIGpt5ResponseModel =
      [PromptModel.OpenAIGpt5].includes(selectedModel) ||
      (isGpt5Default() && !selectedModel);

    const provider = isOpenAIResponseModel
      ? "openai-response"
      : isOpenAIGpt5ResponseModel
        ? "openai-gpt-5-response"
        : selectedModel;

    isGenerating = selectedPromptTool == PromptToolOption.Image;

    const promptForAttachedFilesOnly = fileUrls.length > 0 ? " " : "";

    const payload: RequestPayload = {
      tenantId: $tenant?._id?.toString()!,
      provider,
      prompt: input || promptForAttachedFilesOnly,
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

  function handleChunkEvent(data: any, state: StreamingState): void {
    if (data.content && typeof data.content === "string") {
      // Accumulate the raw text
      state.messageContent += data.content;

      // Append the raw chunk to the current displayed message
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
    sharedMessageHistory.update((messages) => [...messages, newUserMessage]);

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

    const markdownWithLinks = buildCitationLinks(responseText, citations);

    const newAssistantMessage: Message = {
      role: MessageRole.Assistant,
      content: markdownWithLinks,
      rawData: stripMarkdownFormatting(markdownWithLinks),
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
      content: responseText,
      rawData: stripMarkdownFormatting(responseText),
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
    fileUrls?: string[],
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

      // Get API configuration
      const config = await getAPIConfiguration();

      // Build request payload
      const requestBody = buildRequestPayload(fileUrls);

      // Make API request
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

      // Process streaming response
      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        console.log("📡 Streaming response received");

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No reader available");
        }

        input = ""; // Reset prompt for new request
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
    previousResponseId = null;

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveConversation() {
    loading = true;
    const { error, data } = await actions.conversation.save({
      model: selectedModel,
      messages: $sharedMessageHistory,
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
      //navigate(`/conversations/${data.insertedId}`);
    }
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
          showAttachmentButton={!isDisableFileInput}
          onsend={submitForm}
          {toolOptions}
          bind:selectedPromptTool
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
          onValueChange={(_value: any) => {
            selectedPromptTool = PromptToolOption.None;
          }}
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

        <div
          class="min-w-full form-wrapper"
          in:slide={{ duration: 500, delay: 500 }}
          out:slide={{ duration: 500 }}
        >
          <MessageInput
            bind:input
            bind:files
            {isFetching}
            stickyFooter={true}
            showAttachmentButton={!isDisableFileInput}
            onsend={submitForm}
            {toolOptions}
            bind:selectedPromptTool
          />
        </div>
      </div>
    {/if}
  </div>
</div>

<Loading show={loading} />
