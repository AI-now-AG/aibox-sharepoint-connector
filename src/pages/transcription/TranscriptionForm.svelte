<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  const t = useTranslations();

  let isSelectedAudio = false;
  let isDragOver = false;
  let isUploading = false;
  let isUploaded = false;
  let isTranscipted = false;

  let selectedModel = "large";

  let fileName = "";
  let fileSize = 0;
  let fileType = "";

  function isFileTypeValid(extension) {
    // TODO: check file type
    return true;
  }
  function isFileSizeValid(size) {
    // TODO: check file size
    return true;
  }
  function isFileValid({ name, size, type }) {
    if (isFileTypeValid(name) && isFileSizeValid(size)) {
      return true;
    }
    return false;
  }

  function bytesToMegabytes(bytes) {
    const megabytes = bytes / (1024 * 1024);
    return megabytes.toFixed(1);
  }

  function addFiles(
    event: Event & { currentTarget: EventTarget & HTMLInputElement },
  ) {
    const eventTarget = event.target as HTMLInputElement;
    const attachedFile = eventTarget.files[0];
    console.log(attachedFile);
    const { name, size, type } = attachedFile;
    if (!isFileValid({ name, size, type })) {
      return;
    }
    fileName = name;
    fileType = type;
    fileSize = size;

    isSelectedAudio = true;
    isUploading = true;
  }
</script>

<div class="px-14 mt-10">
  <p>1. {t("transcription.select-transcription-model")}</p>
  <select
    class="bg-transparent mt-2 underline"
    on:change={(event) => {
      selectedModel = event.target.value;
    }}
  >
    <option disabled>{t("transciption.model")}</option>
    <option value="large" selected={selectedModel == "large"}
      >{t("transciption.model.size.large")}</option
    >
    <option value="medium" selected={selectedModel == "medium"}
      >{t("transciption.model.size.medium")}</option
    >
    <option value="small" selected={selectedModel == "small"}
      >{t("transciption.model.size.small")}</option
    >
    <option value="base" selected={selectedModel == "base"}
      >{t("transciption.model.size.base")}</option
    >
    <option value="tiny" selected={selectedModel == "tiny"}
      >{t("transciption.model.size.tiny")}</option
    >
  </select>

  <p class="mt-16 mb-2">2. {t("transcription.upload-video-or-audio-file")}</p>
  {#if !isSelectedAudio}
    <div class="relative flex flex-col mt-2">
      <label
        class={`py-6 relative flex flex-col text-base-content border border-dashed rounded cursor-pointer ${isDragOver ? "border-blue-500" : "border-neutral-content"}`}
        on:dragover={() => {
          isDragOver = true;
        }}
        on:dragleave={() => {
          isDragOver = false;
        }}
        on:drop={() => {
          isDragOver = false;
        }}
      >
        <input
          type="file"
          multiple
          class="absolute inset-0 z-50 w-full h-full p-0 m-0 outline-none opacity-0 cursor-pointer"
          on:change={addFiles}
        />

        <div class="flex flex-col items-center">
          {@html svgIcons.upload}
          <p class="text-base font-semibold">
            {@html t("transcription.input-file-upload-description")}
          </p>
          <p class="text-sm text-gray-500 mt-1">
            {t("transcription.supportted-file-extensions")}
          </p>
          <p class="text-xs text-gray-400 mt-8">
            {t("transcription.maximum-capacity")}
          </p>
        </div>
      </label>
    </div>
  {/if}

  {#if isSelectedAudio}
    <div
      class={`flex items-center justify-between p-2 border rounded-lg shadow-sm mt-2 ${isUploading ? "bg-transparent" : "bg-cyan-100"}`}
    >
      <div class="flex items-center">
        <div class="flex-shrink-0 p-2 bg-gray-100 rounded-md">
          {@html svgIcons.document}
        </div>
        <div class="ml-4">
          <p class="font-medium">{fileName}</p>
          <p class="text-sm text-gray-500">
            {fileSize ? bytesToMegabytes(fileSize) + " MB" : ""}
          </p>
        </div>
        <p class="font-medium ml-16">{"00:00 min"}</p>
      </div>
      <div class="flex items-center space-x-6">
        <div class="flex items-center space-x-2">
          {@html svgIcons.uploading}
          <p class="font-medium">{t("transciption.uploading")}</p>
          <button
            on:click={() => {
              isSelectedAudio = false;
              isUploading = false;
            }}
            class="text-gray-500 hover:text-gray-700"
          >
            {@html svgIcons.x}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <div class="mt-8 flex items-center space-x-4">
    <button class={`btn btn-active btn-primary btn-sm`} disabled={!isUploaded}
      >{t("transciption.model.cta.start-transcribing")}</button
    >
    {#if isTranscipted}
      <button class="btn btn-success btn-sm"
        >
        {@html svgIcons.download}
        {t("transciption.model.cta.download-output")}</button
      >
      <button class="btn btn-active btn-sm"
        >{t("transciption.model.cta.start-new-transciption")}</button
      >
    {/if}
  </div>
</div>
