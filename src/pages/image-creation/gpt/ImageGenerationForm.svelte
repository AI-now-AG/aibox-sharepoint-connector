<script lang="ts">
  import { slide } from "svelte/transition";
  import { v4 as uuidv4 } from "uuid";
  import { useTranslations } from "$i18n/utils";
  import { Status } from "$types/ImageTask";
  import { addToast } from "$stores/toast";
  import { MessageRole, type MessageHistory } from "$types/MessageHistory";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import Dropdown from "$components/form/Dropdown.svelte";
  import PromptInput from "./PromptInput.svelte";
  import Output from "./Output.svelte";

  // Types
  type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";
  type ImageQuality = "low" | "medium" | "high";
  type OutputFormat = "png" | "webp" | "jpeg";
  type BackgroundType = "transparent" | "opaque" | "auto";

  interface Props {
    tenantId: string;
  }
  let { tenantId } = $props() as Props;

  const t = useTranslations();

  // Reactive form state
  let uniqueId: string = $state("");
  let prompt: string = $state("");

  let imageQuality: ImageQuality = $state("medium");
  let imageSize: ImageSize = $state("1024x1024");
  let outputFormat: OutputFormat = $state("png");
  let background: BackgroundType = $state("auto");
  let outputCompression: number = $state(100);
  let fileToEdit: File = $state();

  let isBackgroundDisabled: boolean = $state(false);
  let isCompressionDisabled: boolean = $state(false);

  let messages: MessageHistory = $state([]);
  let loading: boolean = $state(false);
  let previousResponseId: string | null = $state(null);

  const sizeOptions = [
    { value: "1024x1024", title: "1024x1024" },
    { value: "1024x1536", title: "1024x1536 (landscape)" },
    { value: "1536x1024", title: "1536x1024 (portrait)" },
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
  $inspect(outputFormat);
  $inspect(messages);

  async function submitForm() {
    uniqueId = uuidv4();
    const payload = {
      prompt,
      imageSize,
      imageQuality,
      outputCompression,
      outputFormat,
      background,
    };

    // reset states
    loading = true;

    // store messages
    messages.push({
      role: MessageRole.User,
      content: prompt,
    });
    console.log("Submitting payload:", payload);

    const params = {
      tenantId,
      uniqueId,
      prompt,
      imageSize,
      imageQuality,
      outputCompression,
      outputFormat,
      background,
      previousResponseId,
    };
    const response = await fetch(
      "/.netlify/functions/gptImageGenerate-background",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      },
    );

    if (response.status !== 202) {
      addToast({
        message: "Failed to start image generation.",
        type: "error",
      });
      loading = false;
      return;
    }

    // clear input text
    prompt = "";

    // start polling requests
    setTimeout(async () => {
      await pollImageStatus(uniqueId);
    }, 2000);
  }

  async function pollImageStatus(
    uniqueId: string,
    maxRetries = 30,
    delayMs = 2000,
  ) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const res = await fetch(
        `/.netlify/functions/gptImageCheckStatus?uid=${uniqueId}`,
      );
      const data = await res.json();

      if (data.status === Status.Completed) {
        messages.push({
          role: MessageRole.Assistant,
          content: data.outputText,
          imageUrl: data.imageUrl,
        });

        previousResponseId = data.responseId;
        loading = false;
        prompt = "";
        return;
      } else if (data.status === Status.Failed) {
        const errorMessage = data.error?.message || "Image generation failed.";
        messages.push({
          role: MessageRole.Assistant,
          content: errorMessage,
        });
        addToast({
          message: errorMessage,
          type: "error",
        });

        loading = false;
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    addToast({
      message: "Image generation timed out.",
      type: "error",
    });
    loading = false;
  }
</script>

<div class="grid grid-cols-1 grid-rows-[1fr_min-content] space-y-6 h-full">
  <div class="flex flex-col space-y-6">
    <h1 class="pt-2 mb-2 lg:pt-8 text-4xl font-bold">
      {t("create-image.create-gpt-image-title")}
    </h1>
    <p>{t("create-image.create-gpt-image-description")}</p>

    <Output {messages} isProcessing={loading} />

    {#if messages.length == 0}
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
            label={t("create-image.image-quality-label")}
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
      class={`mt-8  ${messages.length > 0 ? "sticky bottom-0 bg-base-200" : ""}`}
      transition:slide={{ duration: 500 }}
    >
      {#if messages.length > 0}
        <ScrollToBottom />
      {/if}

      <PromptInput
        bind:input={prompt}
        bind:file={fileToEdit}
        isProcessing={loading}
        stickyFooter={messages.length > 0}
        onsend={submitForm}
      />
    </div>
  </div>
</div>
