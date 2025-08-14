<script lang="ts">
  import { onDestroy } from "svelte";
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
  import { ResponseStatus, ToolName } from "$types/AIResponse";
  import { PromptModel } from "$types/PromptModel";
  import { addToast } from "$stores/toast";
  import { MessageRole, type Message } from "$types/MessageHistory";
  import { readFileContent } from "$utils/fileReader";
  import { formatMarkdown, stripHtmlFormatting } from "$utils/common";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import MessageInput, {
    type Tool,
  } from "$components/chat-ui/MessageInput.svelte";
  import MessageList from "$components/chat-ui/MessageList.svelte";
  import { tenant } from "$stores";
  import { useTranslations } from "$i18n/utils";
  import { ApiKeyProvider } from "$types/TenantFeature";

  const t = useTranslations();

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

  let currentMessage = $state("");
  let currentMessageHistory = $derived(
    $messageHistories[promptId] || getMessageHistory(promptId) || [],
  );

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
  let currentStreamingImageUrl: string = $state("");

  let isGenerating: boolean = $state(false);

  // Use store for previousResponseId
  let previousResponseId: string | null = $derived(
    $previousResponseIds[promptId] ?? getPreviousResponseId(promptId),
  );

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
          folderName: folderName,
        }),
      });

      const uploadData = await uploadResponse.json();
      uploadedFileUrls = uploadData.results;
    }

    await callStreamingAPI((uploadedFileUrls as string[]) || []);
  }

  async function callStreamingAPI(fileUrls: string[] = []) {
    // Reset current message and image at the start of streaming
    currentMessage = "";
    currentStreamingImageUrl = "";

    // Get API configuration (your existing code)
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
    const apiUrl = `${baseUrl}/api/prompt/execute`;

    const isOpenAIResponseModel = [
      PromptModel.OpenAIWithTools,
      PromptModel.OpenAIWithImageTools,
    ].includes(currentPrompt?.model);

    const isOpenAIGpt5ResponseModel =
      [
        PromptModel.OpenAIGpt5,
        PromptModel.OpenAIGpt5WithTools,
        PromptModel.OpenAIGpt5WithImageTools,
      ].includes(currentPrompt?.model) ||
      (isGpt5Default() && !currentPrompt?.model);

    const provider = isOpenAIResponseModel
      ? "openai-response"
      : isOpenAIGpt5ResponseModel
        ? "openai-gpt-5-response"
        : currentPrompt?.model;

    const requestBody = {
      tenantId: $tenant?._id?.toString(),
      provider, //"openai-response",
      prompt,
      promptId,
      stream: true,
      ...(enabledTools.length && { tool: "image_generation" }),
      fileUrls: fileUrls,
      ...(enabledTools.length && {
        imageGenerationOptions: {
          outputFormat: "png",
          quality: "high",
          size: "1024x1024",
          background: "auto",
        },
      }),
      ...(isOpenAIResponseModel && { previousResponseId }),
      ...(!isOpenAIResponseModel && { messageHistory: currentMessageHistory }),
    };

    try {
      const hasImageTool = enabledTools.some(
        (tool) => tool.name === ToolName.Image && tool.active,
      );
      isGenerating = hasImageTool;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        console.log("📡 Streaming response received");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No reader available");
        }

        prompt = ""; // Reset prompt for new request
        let buffer = "";
        let messageContent = "";
        let currentImageUrl = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log("✅ Stream completed");

            // Process any remaining data in buffer
            if (buffer.trim()) {
              const trimmedLine = buffer.trim();
              if (trimmedLine.startsWith("data: ")) {
                try {
                  const jsonStr = trimmedLine.substring(6).trim();
                  if (
                    jsonStr &&
                    jsonStr !== "[DONE]" &&
                    jsonStr.startsWith("{")
                  ) {
                    const data = JSON.parse(jsonStr);
                    console.log(
                      "📥 Processing final buffered data:",
                      data.type,
                    );
                    // Handle the final data if needed
                  }
                } catch (parseError) {
                  console.warn(
                    "Failed to parse final buffer data:",
                    parseError,
                  );
                }
              }
            }

            break;
          }

          const chunk = decoder.decode(value, { stream: true });

          // Add chunk to buffer
          buffer += chunk;

          // Process complete lines from buffer
          const lines = buffer.split("\n");
          // Keep the last line in buffer (might be incomplete)
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith("data: ")) {
              try {
                // Remove the "data: " prefix and parse the JSON
                const jsonStr = trimmedLine.substring(6).trim();

                // Skip empty data lines or completion markers
                if (!jsonStr || jsonStr === "[DONE]" || jsonStr === "") {
                  continue;
                }

                // Basic validation: check if string looks like JSON
                if (!jsonStr.startsWith("{") && !jsonStr.startsWith("[")) {
                  continue;
                }

                const data = JSON.parse(jsonStr);

                switch (data.type) {
                  case "start":
                    console.log(
                      `🚀 Started with ${data.provider} using ${data.model}`,
                    );
                    break;

                  case "chunk":
                    if (data.content && typeof data.content === "string") {
                      messageContent += data.content;
                      currentMessage += data.content;
                      // Format markdown data.content then set into currentMessage
                      currentMessage = formatMarkdown(currentMessage);
                    }
                    break;

                  case "images":
                    console.log(
                      "🖼️ Images generated:",
                      data.images?.length || 0,
                    );
                    if (data.images && data.images.length > 0) {
                      const firstImage = data.images[0];

                      // Store the image URL from the first image
                      const imageData = firstImage.result || firstImage.image;

                      if (imageData) {
                        // Check if it's already a data URL, if not, format it as one
                        if (imageData.startsWith("data:")) {
                          currentImageUrl = imageData;
                          currentStreamingImageUrl = imageData;
                        } else {
                          // Assume it's base64 and format as PNG data URL
                          currentImageUrl = `data:image/png;base64,${imageData}`;
                          currentStreamingImageUrl = `data:image/png;base64,${imageData}`;
                        }
                      }
                    }
                    break;

                  case "tool_outputs":
                    console.log(
                      "🔧 Tool outputs received:",
                      data.outputs.length,
                    );

                    // Check if any tool outputs contain image data
                    data.outputs.forEach((output: any, index: number) => {
                      // If this tool output has image data, store it
                      if (output.image || output.result) {
                        const imageData = output.image || output.result;
                        if (imageData && !currentImageUrl) {
                          if (imageData.startsWith("data:")) {
                            currentImageUrl = imageData;
                            currentStreamingImageUrl = imageData;
                          } else {
                            currentImageUrl = `data:image/png;base64,${imageData}`;
                            currentStreamingImageUrl = `data:image/png;base64,${imageData}`;
                          }
                        }
                      }
                    });
                    break;

                  case "complete":
                    console.log(
                      `✅ Complete! Processing time: ${data.processingTimeMs}ms`,
                    );
                    if (data.responseId) {
                      console.log(`Response ID: ${data.responseId}`);
                    }

                    // Handle Completed Status
                    // Use stored image URL, or fallback to data.images if available
                    const imageUrl =
                      currentImageUrl ||
                      data.images?.[0]?.result ||
                      data.images?.[0]?.image ||
                      "";

                    // If we have image data but no proper URL format, format it
                    const finalImageUrl =
                      imageUrl &&
                      !imageUrl.startsWith("data:") &&
                      !imageUrl.startsWith("http")
                        ? `data:image/png;base64,${imageUrl}`
                        : imageUrl;

                    // Use fullResponse if available, fallback to outputText, then messageContent
                    const responseText =
                      data.fullResponse ??
                      data.outputText ??
                      messageContent ??
                      "";

                    // Add user message to history
                    const newUserMessage: Message = {
                      role: MessageRole.User,
                      content: requestBody.prompt,
                    };
                    addMessageToHistory(groupId, promptId, newUserMessage);

                    const newAssistentMessage: Message = {
                      role: MessageRole.Assistant,
                      content: formatMarkdown(responseText),
                      rawData: stripHtmlFormatting(responseText),
                      imageUrl: finalImageUrl,
                    };
                    addMessageToHistory(groupId, promptId, newAssistentMessage);

                    // Scroll to latest user input
                    setTimeout(() => {
                      scrollIntoView();
                    }, 1000);

                    // Clear input text & files
                    prompt = "";
                    files = [];
                    currentMessage = "";
                    currentStreamingImageUrl = "";

                    // Reset states
                    setPreviousResponseId(promptId, data.responseId);
                    isFetching = false;
                    isGenerating = false;
                    return data;

                  case "error":
                    console.error(`❌ Stream error: ${data.error}`);

                    // Handle Failed Status
                    const errorMessage =
                      data.error || "Image generation failed.";

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

                    currentMessage = "";
                    currentStreamingImageUrl = "";
                    isFetching = false;
                    isGenerating = false;
                    throw new Error(data.error);
                }
              } catch (parseError) {
                // Don't throw the error, just skip this malformed chunk
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ Request failed:", error);
      throw error;
    }
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
        const newUserMessage: Message = {
          role: MessageRole.User,
          content: prompt,
        };
        addMessageToHistory(groupId, promptId, newUserMessage);

        const newAssistentMessage = {
          role: MessageRole.Assistant,
          content: formatMarkdown(data.outputText ?? ""),
          imageUrl,
        };
        addMessageToHistory(groupId, promptId, newAssistentMessage);

        // scroll to latest user input
        setTimeout(() => {
          scrollIntoView();
        }, 1000);

        // clear input text & files
        prompt = "";
        files = [];
        currentMessage = "";
        currentStreamingImageUrl = "";

        // reset states
        setPreviousResponseId(promptId, data.responseId);
        isFetching = false;
        isGenerating = false;
        return;
      } else if (data.status === ResponseStatus.Failed) {
        const errorMessage = data.error?.message || "Image generation failed.";
        const newAssistentMessage = {
          role: MessageRole.Assistant,
          content: errorMessage,
        };
        addMessageToHistory(groupId, promptId, newAssistentMessage);
        addToast({
          message: errorMessage,
          type: "error",
        });

        currentMessage = "";
        currentStreamingImageUrl = "";
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
    currentMessage = "";
    currentStreamingImageUrl = "";
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

  function startNewChat() {
    clearMessageHistory(promptId);
    setPreviousResponseId(promptId, null);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
  />
{/if}

<!-- Prompt Textarea -->
<div
  class={`${currentMessageHistory.length > 0 ? "sticky bottom-0 bg-base-200" : ""}`}
>
  {#if currentMessageHistory.length > 0}
    <ScrollToBottom />
  {/if}
  {#if currentMessageHistory.length > 0}
    <div class="my-4">
      <button
        onclick={startNewChat}
        class="btn btn-active btn-primary btn-sm px-8"
        disabled={isGenerating || isFetching}
      >
        {t("home.new-chat")}
      </button>
    </div>
  {/if}
  <MessageInput
    bind:input={prompt}
    bind:files
    {isFetching}
    stickyFooter={currentMessageHistory.length > 0}
    bind:tools={enabledTools}
    onsend={submitForm}
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
  />
{/if}
