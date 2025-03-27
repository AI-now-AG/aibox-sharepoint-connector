<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_label_has_associated_control -->
<script>
  import { useTranslations } from "$i18n/utils";
  const t = useTranslations();

  let prompt = "";
  let base64Image = "";
  let loading = false;
  let error = "";
  let size = "square";
  let selectedFormat = "png";
  let customWidth = 768;
  let customHeight = 1024;
  let showCustomSizeInputs = false;

  const sizeOptions = [
    { value: "square", label: "Square (512x512)" },
    { value: "square_hd", label: "Square HD (1024x1024)" },
    { value: "portrait_3_4", label: "Portrait 3:4 (768x1024)" },
    { value: "portrait_16_9", label: "Portrait 16:9 (576x1024)" },
    { value: "landscape_4_3", label: "Landscape 4:3 (1024x768)" },
    { value: "landscape_16_9", label: "Landscape 16:9 (1024x576)" },
    { value: "custom", label: "Custom" },
  ];

  const outputOptions = [
    { value: "png", label: "PNG" },
    { value: "jpeg", label: "JPEG" },
  ];

  // TODO: Handle usage and prevent user from generating more than the limit
  let usageStats = {
    today: 22,
    thisMonth: 30,
    available: 3,
  };

  // Show/hide custom size inputs based on selected size
  $: showCustomSizeInputs = size === "custom";

  async function generateImage() {
    if (!prompt.trim()) {
      error = t("create-image.prompt-required");
      return;
    }

    if (size === "custom" && (customWidth <= 0 || customHeight <= 0)) {
      error = t("create-image.invalid-custom-size");
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
      console.log("base64Image", base64Image);
    } catch (err) {
      error = err.message;
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

<div class="flex items-center justify-center p-8">
  <div class="w-full">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">
      {t("create-image.create-flux-dev-image-title")}
    </h1>
    <p class="text-sm text-gray-600 mb-4">
      {t("create-image.create-flux-dev-image-description")}
    </p>

    <form on:submit|preventDefault={generateImage} class="space-y-4">
      <div>
        <textarea
          bind:value={prompt}
          placeholder={t("create-image.create-image-place-holder")}
          class="textarea textarea-bordered w-full h-24 rounded-lg"
          aria-label={t("create-image.create-image-place-holder")}
        ></textarea>
      </div>

      <div class="flex space-x-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {t("create-image.image-size-label")}
          </label>
          <div class="dropdown w-full">
            <label
              tabindex="0"
              class="select select-bordered w-full rounded-lg"
              aria-label={t("create-image.select-image-size-label")}
            >
              {sizeOptions.find((opt) => opt.value === size)?.label ||
                t("create-image.select-image-size-label")}
            </label>
            <ul
              tabindex="0"
              class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full"
            >
              {#each sizeOptions as option}
                <li>
                  <button type="button" on:click={() => (size = option.value)}>
                    {option.label}
                  </button>
                </li>
              {/each}
            </ul>
          </div>
          {#if showCustomSizeInputs}
            <div class="flex space-x-2 mt-2">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Width
                </label>
                <input
                  type="number"
                  bind:value={customWidth}
                  min="1"
                  class="input input-bordered w-full rounded-lg"
                  aria-label="Custom width"
                />
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Height
                </label>
                <input
                  type="number"
                  bind:value={customHeight}
                  min="1"
                  class="input input-bordered w-full rounded-lg"
                  aria-label="Custom height"
                />
              </div>
            </div>
          {/if}
        </div>

        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {t("create-image.image-format-label")}
          </label>
          <div class="dropdown w-full">
            <label
              tabindex="0"
              class="select select-bordered w-full rounded-lg"
              aria-label={t("create-image.select-image-format-label")}
            >
              {outputOptions.find((opt) => opt.value === selectedFormat)
                ?.label || t("create-image.select-image-format-label")}
            </label>
            <ul
              tabindex="0"
              class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full"
            >
              {#each outputOptions as option}
                <li>
                  <button
                    type="button"
                    on:click={() => (selectedFormat = option.value)}
                  >
                    {option.label}
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        class="btn btn-primary w-40 rounded-lg"
      >
        {loading
          ? t("create-image.image-generating")
          : t("create-image.generate-image")}
      </button>
    </form>

    {#if error}
      <p class="text-error text-center mt-4">{error}</p>
    {/if}

    {#if base64Image}
      <div class="mt-6 flex flex-col">
        <img
          src={base64Image}
          alt="Generated by FLUX.1 [dev]"
          class="max-w-[514px] w-full h-auto rounded-lg shadow-lg"
        />
        <button
          on:click={downloadImage}
          class="btn btn-primary w-40 rounded-lg mt-4"
        >
          {t("create-image.download")}
        </button>
      </div>
    {/if}

    <div
      class="mt-6 card bg-base-100 shadow-lg p-4 w-64 ml-auto fixed bottom-10 right-4"
    >
      <h3 class="text-sm font-semibold text-gray-700">
        {t("create-image.usage.current-usage")}
      </h3>
      <p class="text-sm text-gray-600 mt-2">
        {t("create-image.usage.today-usage", { amount: usageStats.today })}
      </p>
      <p class="text-sm text-gray-600">
        {t("create-image.usage.this-month-usage", {
          amount: usageStats.thisMonth,
        })}
      </p>
      <p class="text-sm text-gray-600">
        {t("create-image.usage.available-images", {
          amount: usageStats.available,
        })}
      </p>
    </div>
  </div>
</div>
