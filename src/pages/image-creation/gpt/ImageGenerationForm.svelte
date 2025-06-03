<script lang="ts">
  import { v4 as uuidv4 } from "uuid";
  import { MessageRole, type MessageHistory } from "$types/MessageHistory";
  import Dropdown from "$components/form/Dropdown.svelte";
  import PromptInput from "./PromptInput.svelte";
  import Output from "./Output.svelte";

  // Types
  type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";
  type ImageQuality = "low" | "medium" | "high";
  type OutputFormat = "png" | "webp" | "jpeg";
  type BackgroundType = "transparent" | "opaque" | "auto";

  // Reactive form state
  let uniqueId: string = $state("");
  let prompt: string = $state(
    "Generate an image of gray tabby cat hugging an otter with an orange scarf",
  );

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
  let error: string | null = $state(null);
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

    loading = true;
    error = null;

    messages.push({
      role: MessageRole.User,
      content: prompt,
    });
    console.log("Submitting payload:", payload);

    const params = {
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
      error = "Failed to start image generation.";
      loading = false;
      return;
    }

    await pollImageStatus(uniqueId);
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

      if (data.status === "completed") {
        messages.push({
          role: MessageRole.Assistant,
          content: data.outputText,
          imageUrl: data.imageUrl,
        });

        previousResponseId = data.responseId;
        loading = false;
        prompt = "";
        return;
      } else if (data.status === "error") {
        error = data.error?.message || "Image generation failed.";
        loading = false;
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    error = "Image generation timed out.";
    loading = false;
  }
</script>

<div class="container max-w-6xl mx-auto grid grid-cols-1 px-14">
  <h1 class="pt-2 mb-2 lg:pt-8 text-4xl font-bold">Create GPT Image</h1>
  <p>Create images from the most popular and newest model from OpenAI</p>

  <div class="space-y-4 mt-10">
    <Output {messages} isProcessing={loading} />

    {#if messages.length == 0}
      <div class="flex space-x-4">
        <!-- Output Format -->
        <Dropdown
          classes="flex-1"
          labelClasses="label"
          options={outputFormatOptions}
          bind:value={outputFormat}
          label={"Output Format"}
        />

        <!-- Image Quality -->
        <Dropdown
          classes="flex-1"
          labelClasses="label"
          options={qualityOptions}
          bind:value={imageQuality}
          label={"Image Quality"}
        />

        <!-- Image Size -->
        <Dropdown
          classes="flex-1"
          labelClasses="label"
          options={sizeOptions}
          bind:value={imageSize}
          label={"Image Size"}
        />
      </div>

      <div class="flex flex-row space-x-4">
        <!-- Background -->
        <div class="flex flex-1 flex-col">
          <Dropdown
            classes="flex-1"
            labelClasses="label"
            options={backgroundOptions}
            bind:value={background}
            label={"Background"}
            disabled={isBackgroundDisabled}
          />
        </div>
        <!-- Compression Level -->
        <div class="flex-1">
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="label">
            Compression Level: {outputCompression}%
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
    {/if}

    <!-- Prompt Textarea -->
    <div class="mt-8">
      <PromptInput
        bind:input={prompt}
        bind:file={fileToEdit}
        onsend={submitForm}
      />
    </div>
  </div>

  <div class="mt-12 text-center">
    {#if error}
      <div class="mt-6 text-red-500 font-semibold">
        {error}
      </div>
    {/if}
  </div>
</div>
