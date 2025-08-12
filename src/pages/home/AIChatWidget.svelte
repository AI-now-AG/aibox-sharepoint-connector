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
  import { PromptModel } from "$types/PromptModel";
  import {
    formatMarkdown,
    stripHtmlFormatting,
  } from "$utils/common";
  import ModelInput from "$pages/prompt-library/prompts/ModelInput.svelte";
  import { tenant } from "$stores";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";

  const t = useTranslations();
  
  interface Props {
    apiKeyProviders: any;
    folderName?: string;
  }
  let {
    apiKeyProviders = [],
    folderName,
  }: Props = $props();

  let input = $state("");
  let files: File[] = $state([]);
  let selectedModel: string = $state(PromptModel.OpenAIWithTools);
  let isDisableSelectModel = $state(false);

  let currentMessage = $state("");
  let currentStreamingImageUrl: string = $state("");

  let isFetching: boolean = $state(false);
  let isGenerating: boolean = $state(false);
  let previousResponseId: string | null = $state(null);

  let enabledTools: Tool[] = $state([
    {
      name: "image",
      active: false,
    },
  ]);

  $effect(() => {
    if ($sharedMessageHistory.length > 0 || isFetching) {
      isDisableSelectModel = true;
    } else {
      isDisableSelectModel = false;
    }
  });

  const apiProvider = apiKeyProviders?.find((item: any) => {
    return item.default && item.active;
  });
  let isDisableFileInput = $state(
    apiProvider?.name == PromptModel.Perplexity,
  );

  $effect(() => {
    if (selectedModel == PromptModel.Perplexity) {
      isDisableFileInput = true;
    } else {
      isDisableFileInput = false;
    }
  });

  onDestroy(function () {
    $sharedMessageHistory = [];
  });

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
          folderName,
        }),
      });

      const uploadData = await uploadResponse.json();
      uploadedFileUrls = uploadData.results;
    }

    await callStreamingAPI(uploadedFileUrls as string[] || []);
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

    const isOpenAIResponseModel = [PromptModel.OpenAIWithTools, PromptModel.OpenAIWithImageTools].includes(selectedModel);
    const provider = isOpenAIResponseModel ? "openai-response" : selectedModel;
    const requestBody = {
      tenantId: $tenant?._id?.toString(),
      provider, //"openai-response",
      prompt: input,
      stream: true,
      ...(enabledTools.length && { tool: "image_generation" }),
      fileUrls: fileUrls,
      ...(enabledTools.length && { imageGenerationOptions: {
        outputFormat: "png",
        quality: "high",
        size: "1024x1024",
        background: "auto",
      } }),
      ...(isOpenAIResponseModel && { previousResponseId }),
      ...(!isOpenAIResponseModel && { messageHistory: $sharedMessageHistory }),
    };

    try {
      //const hasImageTool = enabledTools.some(tool => tool.name === ToolName.Image && tool.active);
      //isGenerating = hasImageTool;
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

        input = ""; // Reset prompt for new request
        let buffer = "";
        let messageContent = "";
        let currentImageUrl = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log("✅ Stream completed");
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
                    sharedMessageHistory.update((messages) => [
                      ...messages,
                      newUserMessage,
                    ]);

                    const newAssistentMessage: Message = {
                      role: MessageRole.Assistant,
                      content: formatMarkdown(responseText),
                      rawData: stripHtmlFormatting(responseText),
                      imageUrl: finalImageUrl,
                    };
                    sharedMessageHistory.update((messages) => [
                      ...messages,
                      newAssistentMessage,
                    ]);

                    // Scroll to latest user input
                    setTimeout(() => {
                      scrollIntoView();
                    }, 1000);

                    // Clear input text & files
                    input = "";
                    files = [];
                    currentMessage = "";
                    currentStreamingImageUrl = "";

                    // Reset states
                    previousResponseId = data.responseId;
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
                    sharedMessageHistory.update((messages) => [
                      ...messages,
                      errorUserMessage,
                    ]);
                    
                    const failedMessage: Message = {
                      role: MessageRole.Assistant,
                      content: errorMessage,
                    };
                    sharedMessageHistory.update((messages) => [
                      ...messages,
                      failedMessage,
                    ]);
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
    output = "";
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
          onsend={submitForm}
        />
      </div>
    {/if}

    <div class="flex items-end justify-end z-10">
      <div>
        <ModelInput
          label={t("prompt.text-model")}
          bind:selectedModel
          bind:disabled={isDisableSelectModel}
          labelClasses={"text-sm"}
          excludePromptOptions={true}
        />
      </div>
    </div>

    <MessageList
      {currentMessage}
      messages={$sharedMessageHistory}
      currentImageUrl={currentStreamingImageUrl}
      {isFetching}
      {isGenerating}
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
