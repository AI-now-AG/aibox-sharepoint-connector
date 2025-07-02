<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_label_has_associated_control -->
<!-- svelte-ignore event_directive_deprecated -->
<script lang="ts">
  import Dropdown from "$components/form/Dropdown.svelte";
  import { useTranslations } from "$i18n/utils";
  import Loading from "$components/Loading.svelte";
  import { lastFluxImage } from "$stores/imageGenerationStore";
  import { get } from "svelte/store";
  import { onMount } from "svelte";

  interface Props {
    tenantId: string;
  }
  let { tenantId } = $props() as Props;

  const t = useTranslations();

  let prompt = $state("");
  let base64Image = $state("");
  let loading = $state(false);
  let error: any = $state("");
  let size = $state("square");
  let selectedFormat = $state("png");
  let customWidth = $state(768);
  let customHeight = $state(1024);
  let showCustomSizeInputs = $state(false);

  const sizeOptions = [
    { value: "square", title: "Square (512x512)" },
    { value: "square_hd", title: "Square HD (1024x1024)" },
    { value: "portrait_4_3", title: "Portrait 4:3 (1024x768)" },
    { value: "portrait_16_9", title: "Portrait 16:9 (576x1024)" },
    { value: "landscape_4_3", title: "Landscape 4:3 (1024x768)" },
    { value: "landscape_16_9", title: "Landscape 16:9 (1024x576)" },
    { value: "custom", title: "Custom" },
  ];

  const outputOptions = [
    { value: "png", title: "PNG" },
    { value: "jpeg", title: "JPEG" },
  ];

  $effect(() => {
    if (size === "custom") {
      showCustomSizeInputs = true;
    } else {
      showCustomSizeInputs = false;
    }
  });

  // Restore image from store on mount
  onMount(() => {
    const storedImage = get(lastFluxImage);
    if (storedImage) {
      base64Image = storedImage;
    }
  });

  async function generateImage() {
    if (!prompt.trim()) {
      error = t("create-image.prompt-required-error");
      return;
    }

    if (size === "custom" && (customWidth <= 0 || customHeight <= 0)) {
      error = t("create-image.invalid-custom-size-error");
      return;
    }

    loading = true;
    error = "";
    base64Image = "";

    const formData = new FormData();
    formData.append("prompt", prompt);

    if (size === "custom") {
      formData.append("custom_width", customWidth.toString());
      formData.append("custom_height", customHeight.toString());
      formData.append("image_size", "custom"); // Use a default size for generation, then resize
    } else {
      formData.append("image_size", size);
    }

    try {
      const response = await fetch("/api/generate-image-flux", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("common.unexpected.error"));
      }

      base64Image = `data:image/${selectedFormat};base64,${data.image}`;
      lastFluxImage.set(base64Image); // Store image persistently
    } catch (err) {
      error = err;
    } finally {
      loading = false;
    }
  }

  function downloadImage() {
    if (base64Image) {
      try {
        const base64String = base64Image.split(",")[1];
        const binaryString = atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const mimeType = selectedFormat === "jpeg" ? "image/jpeg" : "image/png";
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `generated-image-${Date.now()}.${selectedFormat}`;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading image:", error);
      }
    }
  }
</script>

<div class="container max-w-6xl mx-auto grid grid-cols-1 px-14">
  <h1 class="pt-2 mb-2 lg:pt-8 text-4xl font-bold">
    {t("create-image.create-flux-dev-image-title")}
  </h1>
  {t("create-image.create-flux-dev-image-description")}

  <form on:submit|preventDefault={generateImage} class="space-y-4 mt-10">
    <div>
      <textarea
        bind:value={prompt}
        placeholder={t("create-image.create-image-place-holder")}
        class="textarea textarea-bordered w-full h-24 rounded-lg text-base"
        aria-label={t("create-image.create-image-place-holder")}
      ></textarea>
    </div>

    <div class="flex space-x-4">
      <Dropdown
        classes="flex-1"
        options={sizeOptions}
        bind:value={size}
        label={t("create-image.image-size-label")}
      >
        {#if showCustomSizeInputs}
          <div class="flex space-x-2 mt-2">
            <div class="flex-1">
              <label class="block mb-1">
                {t("create-image.width")}
              </label>
              <input
                type="number"
                bind:value={customWidth}
                min="100"
                class="input input-bordered w-full rounded-lg"
                aria-label="Custom width"
              />
            </div>
            <div class="flex-1">
              <label class="block mb-1">
                {t("create-image.height")}
              </label>
              <input
                type="number"
                bind:value={customHeight}
                min="100"
                class="input input-bordered w-full rounded-lg"
                aria-label="Custom height"
              />
            </div>
          </div>
        {/if}
      </Dropdown>

      <Dropdown
        classes="flex-1"
        label={t("create-image.image-format-label")}
        options={outputOptions}
        bind:value={selectedFormat}
      />
    </div>

    <button
      type="submit"
      disabled={loading}
      class="btn btn-active btn-primary min-w-[154px]"
    >
      {loading
        ? t("create-image.image-generating")
        : base64Image
          ? t("create-image.generate-new-image")
          : t("create-image.generate-image")}
    </button>
  </form>

  {#if error}
    <p class="text-error text-center mt-4">{error}</p>
  {/if}

  {#if base64Image}
    <div class="mt-6 mb-10">
      <img
        src={base64Image}
        alt="Generated by FLUX.1 [dev]"
        class="max-w-[514px] w-full h-auto rounded-lg shadow-lg"
      />
      <button
        on:click={downloadImage}
        class="btn btn-active btn-primary mt-4 min-w-[154px]"
      >
        {t("create-image.download")}
      </button>
    </div>
  {/if}
</div>

<Loading show={loading} />
