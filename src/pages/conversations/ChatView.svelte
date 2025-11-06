<script lang="ts">
  import { ModelName, PromptToolOption } from "$types/AIProvider";
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
  import {
    getPromptTools,
    useProviderInfo,
    getModelName,
    resolveAPIProvider,
  } from "$shared/AIProvider";
  import { tenant, user } from "$stores";
  import { PromptModel } from "$types/PromptModel";
  import {
    markdownToHtml,
    buildCitationLinks,
    stripMarkdownFormatting,
  } from "$utils/textFormatting";
  import { readFileContent } from "$utils/fileReader";
  import { TRANSCRIPTION_API_URL } from "astro:env/client";
  import { EventName, ScreenName, type EventMessage } from "$types/Posthog";

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
    model?: string;
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
    lastResponseId?: string | null;
  }

  let {
    conversationId,
    model = PromptModel.Default,
    messages,
    promptData,
    folderName,
    lastResponseId = null,
  }: Props = $props();

  let input: string = $state("");
  let files: File[] = $state([]);
  let messageHistory: MessageHistory = $state(messages);
  let currentMessage = $state("");
  let currentStreamingImageUrl: string = $state("");
  let isFetching: boolean = $state(false);
  let isGenerating: boolean = $state(false);
  let isResoningThingking: boolean = $state(false);
  let previousResponseId: string | null = $state(lastResponseId);
  let loading = $state(false);

  let isShowAttachmentButton = $state(model != PromptModel.Perplexity);

  const providerInfo = useProviderInfo($tenant);
  let toolOptions = getPromptTools(
    (model == PromptModel.Default
      ? providerInfo?.defaultProviderPromptModelName
      : model) as PromptModel,
  );

  let selectedPromptTool = $state(PromptToolOption.None);

  async function capturePosthog(params: EventMessage) {
    try {
      actions.posthog.capture(params);
    } catch (error) {
      console.error("Capture Posthog event faield: " + params.event);
    }
  }

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

  async function updateConversationWithNewMessage(messages: Array<Message>) {
    try {
      let _error = null;
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const { error } = await actions.conversation.updateMessage({
          _id: conversationId,
          message,
        });
        _error = error;
      }
      if (_error) {
        addToast({ message: JSON.stringify(_error), type: "error" });
      }
    } catch (error) {
      console.error("Exception when update conversation message", error);
    }
  }

  async function getAPIConfiguration(): Promise<APIConfiguration> {
    return {
      apiUrl: `${TRANSCRIPTION_API_URL}/api/prompt/execute`,
      accessToken: $user?.api_token as string,
    };
  }

  function buildRequestPayload(fileUrls: string[]): RequestPayload {
    const isResponseModel = [
      PromptModel.OpenAI,
      PromptModel.OpenAIWithTools, // Deprecated — removal imminent
      PromptModel.OpenAIWithImageTools, // Deprecated — removal imminent
      PromptModel.OpenAIGpt5,
    ].includes(model);

    const provider: any = resolveAPIProvider(model);

    const isGeminiImageModel = [PromptModel.NanoBanana].includes(model);
    const requestModel = isGeminiImageModel
      ? ModelName.Gemini25FlashImage
      : undefined;

    isGenerating = selectedPromptTool == PromptToolOption.Image;

    const promptForAttachedFilesOnly = fileUrls.length > 0 ? " " : "";

    const payload: RequestPayload = {
      tenantId: $tenant?._id?.toString()!,
      provider,
      model: requestModel,
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

    if (isResponseModel) {
      payload.previousResponseId = previousResponseId;
    } else {
      payload.messageHistory = messageHistory;
    }

    if (isResponseModel) {
      payload.reasoningEffort = "low";
      payload.verbosity = "low";
    }

    return payload;
  }

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

  function handleCitationsEvent(data: any, state: StreamingState): void {
    if (data.citations && data.citations.length > 0) {
      state.citations = data.citations;
    }
  }

  function handleImagesEvent(data: any, state: StreamingState): void {
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

    const newUserMessage: Message = {
      role: MessageRole.User,
      content: requestBody.prompt,
      fileUrls: fileUrls,
    };
    messageHistory.push(newUserMessage);

    let assistantMessage: Message;
    if (state.citations.length > 0) {
      assistantMessage = getAssistantMessageWithCitations(
        responseText,
        state.citations,
        finalImageUrl,
      );
    } else {
      assistantMessage = getAssistantMessage(responseText, finalImageUrl);
    }
    messageHistory.push(assistantMessage);
    updateConversationWithNewMessage([newUserMessage, assistantMessage]);

    // Clean up and reset states
    resetUIState();
    previousResponseId = data.responseId;

    // Scroll to latest message
    setTimeout(() => scrollIntoView(), 1000);

    // Trigger sidebar reload (refetch conversations)
    setTimeout(() => {
      window.dispatchEvent(new Event("reload-sidebar"));
      window.dispatchEvent(new Event("reload-conversation-dialog"));
    }, 1000);

    capturePosthog({
      distinctId: $user?._id?.toString() || "-",
      event: EventName.AiboxPromptResult,
      properties: {
        tenant_id: $tenant?._id?.toString() || "-",
        prompt_name: promptData?.title || "-",
        tool: selectedPromptTool,
        model: getModelName($tenant, model),
        from: ScreenName.MyAibox,
      },
    });

    return data;
  }

  function handleErrorEvent(
    data: any,
    requestBody: RequestPayload,
    fileUrls?: string[],
  ): void {
    const errorMessage = data.error || "Text generation request failed.";

    const errorUserMessage: Message = {
      role: MessageRole.User,
      content: requestBody.prompt,
      fileUrls: fileUrls,
    };
    messageHistory.push(errorUserMessage);

    const failedMessage: Message = {
      role: MessageRole.Assistant,
      content: errorMessage,
    };
    messageHistory.push(failedMessage);
    updateConversationWithNewMessage([errorMessage, failedMessage]);

    addToast({
      message: errorMessage,
      type: "error",
    });

    resetUIState();
    throw new Error(data.error);
  }

  function getAssistantMessageWithCitations(
    responseText: string,
    citations: any[],
    imageUrl: string,
  ): Message {
    const markdownWithLinks = buildCitationLinks(responseText, citations);

    const newAssistantMessage: Message = {
      role: MessageRole.Assistant,
      content: markdownWithLinks,
      rawData: stripMarkdownFormatting(markdownWithLinks),
      imageUrl,
    };

    return newAssistantMessage;
  }

  function getAssistantMessage(
    responseText: string,
    imageUrl: string,
  ): Message {
    const newAssistantMessage: Message = {
      role: MessageRole.Assistant,
      content: responseText,
      rawData: stripMarkdownFormatting(responseText),
      imageUrl,
    };

    return newAssistantMessage;
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
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const data = parseStreamLine(line);
        if (data) {
          const result = processStreamEvent(data, state, requestBody, fileUrls);
          if (result) {
            return result;
          }
        }
      }
    }
  }

  async function callStreamingAPI(fileUrls: string[] = []) {
    try {
      resetStreamingState();
      const config = await getAPIConfiguration();
      const requestBody = buildRequestPayload(fileUrls);

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

      if (response.headers.get("content-type")?.includes("text/event-stream")) {
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

<div class="grid grid-cols-1 grid-rows-[min-content_1fr_min-content] h-full">
  <div class="flex items-center">
    <div class="flex flex-1">
      <span
        class="self-start badge badge-xs py-2 px-2 border-base-300 font-normal"
        >{getModelName($tenant, model)}</span
      >
    </div>
    <div class="flex justify-end pr-4">
      <button
        class="btn btn-sm btn-outline font-normal"
        onclick={() => {
          deleteConversation();
        }}
      >
        {t("conversation.remove-from-my-ai-box")}
      </button>
    </div>
  </div>

  <MessageList
    {currentMessage}
    {messages}
    currentImageUrl={currentStreamingImageUrl}
    {isFetching}
    {isGenerating}
    {isResoningThingking}
  />

  <div class="sticky bottom-0 bg-base-200 p-4">
    <div class="mt-2">
      <ScrollToBottom />
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
        allowFileUpload={isShowAttachmentButton}
      />
    </div>
  </div>
</div>

<Loading show={loading} />
