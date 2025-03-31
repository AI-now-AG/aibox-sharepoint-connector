<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_label_has_associated_control -->
<!-- svelte-ignore event_directive_deprecated -->
<script lang="ts">
  import { actions } from "astro:actions";
  import SelectOptions from "$components/SelectOptions.svelte";
  import { useTranslations } from "$i18n/utils";
  import ImageCreationUsage from "../ImageCreationUsage.svelte";
  import { onMount } from "svelte";
  import log from "$utils/log";
  import { addToast } from "$stores/toast";
  import moment from "moment";
  import Loading from "$components/Loading.svelte";
  const t = useTranslations();

  interface Props {
    tenantId: string;
  }
  let { tenantId } = $props() as Props;

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

  let usageStats = $state({
    today: 0,
    thisMonth: 0,
    available: 0,
    monthlyLimit: 0,
  });

  $effect(() => {
    if (size === "custom") {
      showCustomSizeInputs = true;
    } else {
      showCustomSizeInputs = false;
    }
  });

  async function checkUsage() {
    try {
      loading = true;
      const month = moment(Date.now()).format("YYYY-MM");
      const result = await actions.usage.getMonthlyImageUsage({
        tenant_id: tenantId,
        month: month,
      });

      log.d(result?.data?.imageFlux, "RESULT USAGE FLUX/DEV");
      if (result?.data) {
        const { imageFlux } = result.data;
        usageStats = {
          ...usageStats,
          today: imageFlux.todayAmount || 0,
          thisMonth: imageFlux.thisMonthAmount || 0,
          monthlyLimit: imageFlux.limitRequests || 0,
          available: imageFlux.availableAmount || 0,
        };
      }
    } catch (error) {
      log.e(error, "Check Usage error");
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    checkUsage();
    return () => {};
  });

  async function generateImage() {
    if (usageStats.available <= 0) {
      addToast({
        type: "error",
        message: t("create-image.usage.reach-limitation-message", {
          amount: usageStats.monthlyLimit,
        }),
      });
      return;
    }

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
      usageStats = {
        ...usageStats,
        today: usageStats.today + 1,
        thisMonth: usageStats.thisMonth + 1,
        available: usageStats.available - 1,
      };
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

  <form on:submit|preventDefault={generateImage} class="space-y-4 mt-4">
    <div>
      <textarea
        bind:value={prompt}
        placeholder={t("create-image.create-image-place-holder")}
        class="textarea textarea-bordered w-full h-24 rounded-lg text-base"
        aria-label={t("create-image.create-image-place-holder")}
      ></textarea>
    </div>

    <div class="flex space-x-4">
      <SelectOptions
        classes="flex-1"
        label={t("create-image.image-size-label")}
        options={sizeOptions}
        bind:value={size}
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
      </SelectOptions>

      <SelectOptions
        classes="flex-1"
        label={t("create-image.image-format-label")}
        options={outputOptions}
        bind:value={selectedFormat}
      ></SelectOptions>
    </div>

    <button
      type="submit"
      disabled={loading}
      class="btn btn-active btn-primary min-w-[154px]"
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

  {#if !loading}
    <ImageCreationUsage
      todayAmount={usageStats.today}
      thisMonthAmount={usageStats.thisMonth}
      availableAmount={usageStats.available}
      monthlyLimit={usageStats.monthlyLimit}
    />
  {/if}
</div>

<Loading show={loading} />
