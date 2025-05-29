<script lang="ts">
  import { v4 as uuidv4 } from "uuid";
  import { preventDefault } from "$utils/common";

  // Types
  type ImageSize = "1024x1024" | "1024x1536";
  type OutputFormat = "PNG" | "JPEG" | "WebP";
  type BackgroundType = "transparent" | "opaque";

  // Reactive form state
  let jobId = $state<string>("");
  let prompt = $state<string>(
    "Generate an image of gray tabby cat hugging an otter with an orange scarf",
  );
  let imageSize = $state<ImageSize>("1024x1024");
  let imageQuality = $state<number>(80);
  let compressionLevel = $state<number>(75);
  let outputFormat = $state<OutputFormat>("PNG");
  let background = $state<BackgroundType>("transparent");

  let loading = $state(false);
  let imageUrl = $state<string | null>(null);
  let error = $state<string | null>(null);

  async function submitForm() {
    jobId = uuidv4();
    const payload = {
      prompt,
      imageSize,
      imageQuality,
      compressionLevel,
      outputFormat,
      background,
    };

    loading = true;
    imageUrl = null;
    error = null;
    console.log("Submitting payload:", payload);

    const params = {
      jobId,
      prompt,
      imageSize,
      imageQuality,
      compressionLevel,
      outputFormat,
      background,
    };
    const response = await fetch(
      "/.netlify/functions/createGPTImage-background",
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

    await pollImageStatus(jobId);
  }

  async function pollImageStatus(
    jobId: string,
    maxRetries = 30,
    delayMs = 2000,
  ) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const res = await fetch(
        `/.netlify/functions/checkGPTImageStatus?jobId=${jobId}`,
      );
      const data = await res.json();

      if (data.status === "completed") {
        imageUrl = data.imageUrl;
        loading = false;
        return;
      } else if (data.status === "error") {
        error = "Image generation failed.";
        loading = false;
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    error = "Image generation timed out.";
  }
</script>

<form
  class="space-y-4 p-6"
  onsubmit={preventDefault(() => {
    submitForm();
  })}
>
  <h2 class="text-xl font-bold">Create GPT Image</h2>

  <div class="flex space-x-4">
    <!-- Prompt Textarea -->
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <div class="flex-1">
      <label class="label block">Prompt</label>
      <textarea
        bind:value={prompt}
        class="textarea textarea-bordered w-full"
        placeholder="Describe the image you want to generate"
        rows="4"
      ></textarea>
    </div>
  </div>

  <div class="flex space-x-4">
    <!-- Image Size -->
    <div class="flex-1">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="label">Image Size </label>
      <select bind:value={imageSize} class="select select-bordered">
        <option value="1024x1024">1024x1024</option>
        <option value="1024x1536">1024x1536</option>
      </select>
    </div>

    <!-- Image Quality -->
    <div class="flex-1">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="label">
        Image Quality: {imageQuality}%
      </label>
      <input
        type="range"
        min="1"
        max="100"
        bind:value={imageQuality}
        class="range range-primary"
      />
    </div>

    <!-- Compression Level -->
    <div class="form-control">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="label">
        Compression Level: {compressionLevel}%
      </label>
      <input
        type="range"
        min="0"
        max="100"
        bind:value={compressionLevel}
        class="range range-secondary"
      />
    </div>
  </div>

  <div class="flex flex-row space-x-4">
    <!-- Output Format -->
    <div class="flex flex-1 flex-col">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="label"> Output Format </label>
      <select bind:value={outputFormat} class="select select-bordered">
        <option value="PNG">PNG</option>
        <option value="JPEG">JPEG</option>
        <option value="WebP">WebP</option>
      </select>
    </div>

    <!-- Background -->
    <div class="flex flex-1 flex-col">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="label">Background</label>
      <select bind:value={background} class="select select-bordered">
        <option value="transparent">Transparent</option>
        <option value="opaque">Opaque</option>
      </select>
    </div>
    <div class="flex flex-1 flex-col"></div>
  </div>

  <button type="submit" class="btn btn-primary mt-4">Generate Image</button>
</form>

<div class="mt-12">
  {#if loading}
    <div class="mt-6 text-center">
      <p class="text-gray-600">Generating image, please wait...</p>
      <span class="loading loading-spinner loading-lg mt-2"></span>
    </div>
  {/if}

  {#if error}
    <div class="mt-6 text-red-500 font-semibold">
      {error}
    </div>
  {/if}

  {#if imageUrl}
    <div class="mt-6">
      <h3 class="text-lg font-bold mb-2">Generated Image:</h3>
      <!-- svelte-ignore a11y_img_redundant_alt -->
      <img
        src={imageUrl}
        alt="Generated image"
        class="rounded-lg shadow-lg max-w-full"
      />
    </div>
  {/if}
</div>
