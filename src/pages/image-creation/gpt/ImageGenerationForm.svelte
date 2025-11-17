<script lang="ts">
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import { MessageRole, type Message } from "$types/MessageHistory";
  import { readFileContent } from "$utils/fileReader";
  import { capitalizeFirst } from "$utils/common";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import Dropdown from "$components/form/Dropdown.svelte";
  import MessageInput from "$components/chat-ui/MessageInput.svelte";
  import MessageList from "$components/chat-ui/MessageList.svelte";
  import { tenant, user } from "$stores";
  import {
    gptImageMessageHistory,
    gptImageFiles,
    gptImagePreviousResponseId,
  } from "$stores/gptImageMessageHistory";
  import {
    markdownToHtml,
    stripMarkdownFormatting,
  } from "$utils/textFormatting";
  import { ModelName, PromptToolOption } from "$types/AIProvider";
  import { TRANSCRIPTION_API_URL } from "astro:env/client";
  import { EventName, ScreenName } from "$types/Posthog";
  import { posthogClientCapture } from "$utils/posthogClient";

  // === Types and Interfaces ===
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
    stream: boolean;
    tool?: string;
    fileUrls: string[];
    imageGenerationOptions?: any;
    previousResponseId?: string | null;
    messageHistory?: Message[];
    promptTool?: string;
  }

  // Types
  type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";
  type ImageQuality = "low" | "medium" | "high";
  type OutputFormat = "png" | "webp" | "jpeg";
  type BackgroundType = "transparent" | "opaque" | "auto";

  const t = useTranslations();

  // Reactive form state
  let input: string = $state("");
  let currentMessage = $state("");
  let currentStreamingImageUrl: string = $state("");
  let isFetching: boolean = $state(false);
  let isGenerating: boolean = $state(false);
  let previousResponseId: string | null = $state(null);

  let imageQuality: ImageQuality = $state("medium");
  let imageSize: ImageSize = $state("1024x1024");
  let outputFormat: OutputFormat = $state("png");
  let background: BackgroundType = $state("auto");
  let outputCompression: number = $state(100);
  let files: File[] = $state([]);

  let isBackgroundDisabled: boolean = $state(false);
  let isCompressionDisabled: boolean = $state(false);

  const sizeOptions = [
    { value: "1024x1024", title: "1024x1024" },
    { value: "1024x1536", title: "1024x1536 (portrait)" },
    { value: "1536x1024", title: "1536x1024 (landscape)" },
  ];

  const qualityOptions = [
    { value: "low", title: "Low" },
    { value: "medium", title: "Medium" },
    { value: "high", title: "High" },
  ];

  const outputFormatOptions = [
    { value: "png", title: "PNG" },
    { value: "webp", title: "WEBP" },
    { value: "jpeg", title: "JPEG" },
  ];

  const backgroundOptions = [
    { value: "transparent", title: "Transparent" },
    { value: "opaque", title: "Opaque" },
    { value: "auto", title: "Auto" },
  ];

  $effect(() => {
    isBackgroundDisabled = outputFormat == "jpeg";
    isCompressionDisabled = outputFormat == "png";
  });

  // Restore files, and previousResponseId on mount
  onMount(() => {
    if ($gptImageFiles && $gptImageFiles.length > 0) {
      files = [...$gptImageFiles];
    }

    if ($gptImagePreviousResponseId) {
      previousResponseId = $gptImagePreviousResponseId;
    }
  });

  // Save files, and previousResponseId whenever they change
  $effect(() => {
    $gptImageFiles = files;
    $gptImagePreviousResponseId = previousResponseId;
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
    isGenerating = true;

    const promptForAttachedFilesOnly = fileUrls.length > 0 ? " " : "";

    const payload: RequestPayload = {
      tenantId: $tenant?._id?.toString()!,
      provider: "openai-response",
      prompt: input || promptForAttachedFilesOnly,
      stream: true,
      fileUrls,
      previousResponseId: previousResponseId,
      tool: PromptToolOption.Image,
      imageGenerationOptions: {
        outputFormat,
        quality: imageQuality,
        size: imageSize,
        background,
      },
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

  function handleImagesEvent(data: any, state: StreamingState): void {
    console.log("🖼️ Images generated:", data.images?.length || 0);

    if (data.images && data.images.length > 0) {
      const firstImage = data.images[0];
      const imageData = extractImageFromData(firstImage);

      if (imageData) {
        const formattedUrl = formatImageUrl(imageData);
        state.currentImageUrl = formattedUrl;
        currentStreamingImageUrl = formattedUrl;

        posthogClientCapture($tenant, EventName.AiboxImageCreated, {
          page_name: ScreenName.GptImageGeneration,
          model: ModelName.GptImage,
        });
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
    gptImageMessageHistory.update((messages) => [...messages, newUserMessage]);

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
    gptImageMessageHistory.update((messages) => [
      ...messages,
      errorUserMessage,
    ]);

    const failedMessage: Message = {
      role: MessageRole.Assistant,
      content: errorMessage,
    };
    gptImageMessageHistory.update((messages) => [...messages, failedMessage]);

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

    gptImageMessageHistory.update((messages) => [
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

      // Get API configuration
      const config = await getAPIConfiguration();

      // Build request payload
      const requestBody = buildRequestPayload(fileUrls);

      // Make API request
      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          //"X-API-Key": config.apiKey,
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

        input = ""; // Reset prompt for new request
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

  function getInfoText() {
    return t("create-image.image-info-text", {
      format: outputFormat.toUpperCase(),
      quality: capitalizeFirst(imageQuality),
      size: imageSize,
    });
  }

  function startNewChat() {
    input = "";
    files = [];
    isFetching = false;
    previousResponseId = null;
    $gptImageMessageHistory = [];
    $gptImageFiles = [];
    $gptImagePreviousResponseId = null;

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
</script>

<div class="grid grid-cols-1 grid-rows-[1fr_min-content] space-y-6 h-full">
  <div class="flex flex-col space-y-6">
    <h1 class="pt-2 mb-2 lg:pt-8 text-4xl font-bold">
      {t("create-image.create-gpt-image-title")}
    </h1>
    <p class="m-0">{t("create-image.create-gpt-image-description")}</p>

    <!-- Output (Follow-Up) -->
    {#if $gptImageMessageHistory.length > 0}
      <MessageList
        messages={$gptImageMessageHistory}
        {isFetching}
        {isGenerating}
        {currentMessage}
        currentImageUrl={currentStreamingImageUrl}
        infoText={getInfoText()}
      />
    {/if}

    {#if $gptImageMessageHistory.length == 0}
      <div class="space-y-4 mt-10">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Output Format -->
          <Dropdown
            classes="flex-1"
            labelClasses="label"
            options={outputFormatOptions}
            bind:value={outputFormat}
            label={t("create-image.image-format-label")}
          />

          <!-- Image Quality -->
          <Dropdown
            classes="flex-1"
            labelClasses="label"
            options={qualityOptions}
            bind:value={imageQuality}
            label={t("create-image.select-image-quality-label")}
          />

          <!-- Image Size -->
          <Dropdown
            classes="flex-1"
            labelClasses="label"
            options={sizeOptions}
            bind:value={imageSize}
            label={t("create-image.image-size-label")}
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Background -->
          <div class="flex flex-1 flex-col">
            <Dropdown
              classes="flex-1"
              labelClasses="label"
              options={backgroundOptions}
              bind:value={background}
              label={t("create-image.image-background-label")}
              disabled={isBackgroundDisabled}
            />
          </div>
          <!-- Compression Level -->
          <div class="flex-1">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="label">
              {t("create-image.image-compression-label")}
              <span class="text-xs">({outputCompression}%)</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              bind:value={outputCompression}
              class="range range-primary range-xs mt-4"
              disabled={isCompressionDisabled}
            />
          </div>
          <div class="flex flex-1 flex-col"></div>
        </div>
      </div>
    {/if}

    <!-- Prompt Textarea -->
    <div
      class={`mt-8  ${$gptImageMessageHistory.length > 0 ? "sticky bottom-0 bg-base-200" : ""}`}
      transition:slide={{ duration: 500 }}
    >
      {#if $gptImageMessageHistory.length > 0}
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
        stickyFooter={$gptImageMessageHistory.length > 0}
        onsend={submitForm}
      />
    </div>

    <!-- Output (Normal) -->
    {#if $gptImageMessageHistory.length == 0}
      <MessageList
        messages={$gptImageMessageHistory}
        {isFetching}
        {isGenerating}
        {currentMessage}
        currentImageUrl={currentStreamingImageUrl}
      />
    {/if}
  </div>
</div>
