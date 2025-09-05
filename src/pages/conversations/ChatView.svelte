<script lang="ts">
  import { PromptToolOption } from "$types/AIProvider";
  import {
    MessageRole,
    type Message,
    type MessageHistory,
  } from "$types/MessageHistory";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import MessageInput from "$components/chat-ui/MessageInput.svelte";
  import MessageList from "$components/chat-ui/MessageList.svelte";
  import { useTranslations } from "$i18n/utils";
  import { actions } from "astro:actions";
  import Loading from "$components/Loading.svelte";
  import { addToast } from "$stores/toast";
  import { getPromptTools, useProviderInfo } from "$shared/AIProvider";
  import { tenant, user } from "$stores";
  import { PromptModel } from "$types/PromptModel";
  import {
    buildCitationLinks,
    markdownToHtml,
    stripHtmlFormatting,
  } from "$utils/textFormatting";
  import { ApiKeyProvider } from "$types/TenantFeature";
  import { readFileContent } from "$utils/fileReader";

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
    conversationId: string;
    model: PromptModel;
    messages: MessageHistory;
    promptData: any;
    folderName?: string;
  }

  let {
    conversationId,
    model = PromptModel.Default,
    messages,
    folderName,
  }: Props = $props();

  let input: string = $state("");
  let files: File[] = $state([]);
  let messageHistory: MessageHistory = $state(messages);
  let currentMessage = $state("");
  let currentStreamingImageUrl: string = $state("");
  let isFetching: boolean = $state(false);
  let isGenerating: boolean = $state(false);
  let isResoningThingking: boolean = $state(false);
  let previousResponseId: string | null = $state(null);
  let loading = $state(false);

  const providerIno = useProviderInfo($tenant);
  let toolOptions = getPromptTools(
    (model == PromptModel.Default
      ? providerIno?.defaultProviderPromptModelName == PromptModel.OpenAI
        ? PromptModel.OpenAIWithTools
        : providerIno?.defaultProviderPromptModelName
      : model) as PromptModel,
  );

  let selectedPromptTool = $state(PromptToolOption.None);

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

  async function updateConversation() {
    try {
      const { error } = await actions.conversation.update({
        _id: conversationId,
        messages: messageHistory,
      });
      if (error) {
        addToast({ message: JSON.stringify(error), type: "error" });
      }
    } catch (error) {
      console.error("Exception when update conversation", error);
    }
  }

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

  function buildRequestPayload(fileUrls: string[]): RequestPayload {
    const isOpenAIResponseModel = [PromptModel.OpenAIWithTools].includes(model);

    const isOpenAIGpt5ResponseModel =
      [PromptModel.OpenAIGpt5].includes(model) || (isGpt5Default() && !model);

    const provider = isOpenAIResponseModel
      ? "openai-response"
      : isOpenAIGpt5ResponseModel
        ? "openai-gpt-5-response"
        : model;

    isGenerating = selectedPromptTool == PromptToolOption.Image;

    const promptForAttachedFilesOnly = fileUrls.length > 0 ? " " : "";

    const payload: RequestPayload = {
      tenantId: $tenant?._id?.toString()!,
      provider,
      prompt: input || promptForAttachedFilesOnly,
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

    if (isOpenAIResponseModel) {
      payload.previousResponseId = previousResponseId;
    } else {
      payload.messageHistory = messageHistory;
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

    messageHistory.push(newUserMessage);
    updateConversation();
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

  function handleErrorEvent(data: any, requestBody: RequestPayload): void {
    console.error(`❌ Stream error: ${data.error}`);

    const errorMessage = data.error || "Image generation failed.";

    // Add user message to history
    const errorUserMessage: Message = {
      role: MessageRole.User,
      content: requestBody.prompt,
    };

    messageHistory.push(errorUserMessage);

    const failedMessage: Message = {
      role: MessageRole.Assistant,
      content: errorMessage,
    };

    messageHistory.push(failedMessage);
    updateConversation();

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

    messageHistory.push(newAssistantMessage);
    updateConversation();
  }

  function addAssistantMessage(responseText: string, imageUrl: string): void {
    const newAssistantMessage: Message = {
      role: MessageRole.Assistant,
      content: markdownToHtml(responseText),
      rawData: stripHtmlFormatting(responseText),
      imageUrl,
    };

    messageHistory.push(newAssistantMessage);
    updateConversation();
  }

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

  function parseStreamLine(line: string): any | null {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith("data: ")) {
      return null;
    }

    const jsonStr = trimmedLine.substring(6).trim();

    if (!jsonStr || jsonStr === "[DONE]" || jsonStr === "") {
      return null;
    }

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
      const accessToken = $user?.auth0_access_token;
      if (!accessToken) {
        addToast({
          message: t("auth.session-missing-force-login"),
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
          Authorization: `Bearer ${accessToken}`,
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
    {isResoningThingking}
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
        showDataLossWarning={false}
      />
    </div>
  </div>
</div>

<Loading show={loading} />
