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
  import { ApiKeyProvider } from "$types/TenantFeature";
  import { addToast } from "$stores/toast";
  const t = useTranslations();

  interface Props {
    tenantId: string;
  }
  let { tenantId } = $props() as Props;

  let prompt = $state("");
  let base64Image = $state("");
  let loading = $state(false);
  let error: any = $state("");
  let size = $state("1024x1024");
  let quality = $state("standard");
  let selectedFormat = $state("png");

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

  let usageStats = $state({
    today: 0,
    thisMonth: 0,
    available: 0,
    monthlyLimit: 3,
  });

  async function checkUsage() {
    try {
      loading = true;
      const result = await actions.usage.countImageGenerationRequests({
        tenant_id: tenantId,
        provider: ApiKeyProvider.OpenAI.toString(),
        model: "dall-e-3",
      });
      log.d(result, "RESULT USAGE");
      if (result?.data) {
        const { total_requests_this_month, total_requests_today } = result.data;
        usageStats = {
          ...usageStats,
          today: total_requests_today,
          thisMonth: total_requests_this_month,
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
      error = err;
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

<div class="container max-w-6xl mx-auto grid grid-cols-1 px-14">
  <h1 class="pt-2 mb-2 lg:pt-8 text-4xl font-bold">
    {t("create-image.create-dalle-image-title")}
  </h1>
  {t("create-image.create-dalle-image-description")}

  <form on:submit|preventDefault={generateImage} class="space-y-4 mt-4">
    <div>
      <textarea
        bind:value={prompt}
        placeholder={t("create-image.create-image-place-holder")}
        class="textarea textarea-bordered w-full h-24 rounded-lg text-base"
      ></textarea>
    </div>

    <div class="flex space-x-4">
      <SelectOptions
        classes="flex-1"
        label={t("create-image.image-size-label")}
        options={sizeOptions}
        bind:value={size}
      />

      <SelectOptions
        classes="flex-1"
        label={t("create-image.select-image-quality-label")}
        options={qualityOptions}
        bind:value={quality}
      />

      <SelectOptions
        classes="flex-1"
        label={t("create-image.image-format-label")}
        options={outputOptions}
        bind:value={selectedFormat}
      />
    </div>

    <button
      type="submit"
      disabled={loading || usageStats.available <= 0}
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
    <div class="mt-6">
      <img
        src={base64Image}
        alt="Generated by DALL-E 3"
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

  <ImageCreationUsage
    todayAmount={usageStats.today}
    thisMonthAmount={usageStats.thisMonth}
    availableAmount={usageStats.available}
    monthlyLimit={usageStats.monthlyLimit}
  />
</div>
