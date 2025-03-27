<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_label_has_associated_control -->
<script>
  import { useTranslations } from "$i18n/utils";
  const t = useTranslations();

  let prompt = "";
  let base64Image = "";
  let loading = false;
  let error = "";
  let size = "1024x1024";
  let quality = "standard";
  let selectedFormat = "png";

  const sizeOptions = [
    { value: "1024x1024", label: "1024x1024" },
    { value: "1792x1024", label: "1792x1024" },
    { value: "1024x1792", label: "1024x1792" },
  ];

  const qualityOptions = [
    { value: "standard", label: "Standard" },
    { value: "hd", label: "HD" },
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

  async function generateImage() {
    loading = true;
    error = "";
    base64Image = "";

    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("size", size);
    formData.append("quality", quality);
    formData.append("output_format", selectedFormat);

    try {
      const response = await fetch("/api/generate-image-openai", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("common.unexpected.error"));
      }

      base64Image = "data:image/png;base64," + data.image;
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
        const base64String = base64Image.startsWith("data:image")
          ? base64Image.split(",")[1]
          : base64Image;

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
      {t("create-image.create-dalle-image-title")}
    </h1>
    <p class="text-sm text-gray-600 mb-4">
      {t("create-image.create-dalle-image-description")}
    </p>

    <form on:submit|preventDefault={generateImage} class="space-y-4">
      <div>
        <textarea
          bind:value={prompt}
          placeholder={t("create-image.create-image-place-holder")}
          class="textarea textarea-bordered w-full h-24 rounded-lg"
        ></textarea>
      </div>

      <div class="flex space-x-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >{t("create-image.image-size-label")}</label
          >
          <div class="dropdown w-full">
            <label
              tabindex="0"
              class="select select-bordered w-full rounded-lg"
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
        </div>

        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >{t("create-image.image-quality-label")}</label
          >
          <div class="dropdown w-full">
            <label
              tabindex="0"
              class="select select-bordered w-full rounded-lg"
            >
              {qualityOptions.find((opt) => opt.value === quality)?.label ||
                t("create-image.select-image-quality-label")}
            </label>
            <ul
              tabindex="0"
              class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full"
            >
              {#each qualityOptions as option}
                <li>
                  <button
                    type="button"
                    on:click={() => (quality = option.value)}
                  >
                    {option.label}
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        </div>

        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >{t("create-image.image-format-label")}</label
          >
          <div class="dropdown w-full">
            <label
              tabindex="0"
              class="select select-bordered w-full rounded-lg"
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
          ? t("create-image.image-generatiing")
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
          alt="Generated by DALL-E 3"
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
        {t("create-image.usage.availble-images", {
          amount: usageStats.available,
        })}
      </p>
    </div>
  </div>
</div>
