<script lang="ts">
  import { onMount } from "svelte";
  import StartNewConfirmDialog from "./StartNewConfirmDialog.svelte";
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  import { transcription, storeTranscribe } from "$stores/transcription";
  import { addToast } from "$stores/toast";

  const t = useTranslations();

  // general
  let audioFile: File;
  let isDragOver: boolean = false;
  let selectedModel = "large";
  let output: string = "";

  // states
  let isUploading: boolean = false;
  let isUploaded: boolean = false;
  let isTranscribing: boolean = false;
  let isTranscipted: boolean = false;

  // API, polling
  let intervalId;
  let tempUploadUrl;
  let tempOutputFileName;

  let confirmModal: HTMLDialogElement;

  onMount(async () => {
    console.log("OnMount transcription in store", $transcription);
    if ($transcription) {
      retrieveDataInStore();
    }
  });

  function retrieveDataInStore() {
    audioFile = $transcription.file;
    output = $transcription.output;

    isUploaded = true;
    isTranscipted = true;
  }

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

  async function getSASToken() {
    const response = await fetch("/.netlify/functions/getSASToken");
    return await response.json();
  }

  async function uploadBlobFile(uploadUrl: string, file: File) {
    return await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": file.type,
      },
    });
  }

  async function addFiles(
    event: Event & { currentTarget: EventTarget & HTMLInputElement },
  ) {
    const eventTarget = event.target as HTMLInputElement;
    audioFile = eventTarget.files[0];

    console.log("Selected audio file", audioFile);

    const { name, size, type } = audioFile;
    if (!isFileValid({ name, size, type })) {
      return;
    }

    isUploading = true;

    // Get Azure Storage SAS tokens
    const { uploadUrl, outputFileName } = await getSASToken();
    console.log("Azue SAS tokens response", { uploadUrl, outputFileName });

    // Upload the file to Azure Blob Storage
    const response = await uploadBlobFile(uploadUrl, audioFile);

    // Store temporary upload URL, filename for later
    tempUploadUrl = uploadUrl;
    tempOutputFileName = `${outputFileName}_output.txt`;
    console.log("Temp output file name", tempOutputFileName);

    if (response.ok) {
      isUploading = false;
      isUploaded = true;
    }
  }

  async function transcribe() {
    try {
      isTranscribing = true;

      const response = await fetch(
        "/.netlify/functions/uploadAudio-background",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: audioFile.name,
            uploadUrl: tempUploadUrl,
            mimeType: audioFile.type,
          }),
        },
      );

      console.log("Upload audio background response", {
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        startPolling();
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }

  async function checkOutputFileReady() {
    try {
      const response = await fetch("/.netlify/functions/checkFileExist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: tempOutputFileName }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Check output file ready response", result);

        if (result.exists) {
          clearInterval(intervalId);

          output = result.transcription;
          storeTranscribe({ file: audioFile, output });
          addToast({
            message:
              '<a href="/transcription">Your transcription is ready. Tap to see.</a>',
            type: "success",
          });

          isTranscribing = false;
          isTranscipted = true;

          console.log("File found!");
        } else {
          console.console.warn("File not found yet");
        }
      }
    } catch (error) {
      console.error("Check output file ready error", error);
    }
  }

  function startPolling() {
    intervalId = setInterval(checkOutputFileReady, 5000);
  }

  function confirmStartNew() {
    confirmModal.showModal();
  }

  function startNew() {
    reset();
    confirmModal.close();
  }

  function downloadFile() {
    console.log("Download file!");
    confirmModal.close();
  }

  function removeFile() {
    reset();
  }

  function reset() {
    audioFile = null;
    isUploading = false;
    isUploaded = false;
    isTranscribing = false;
    isTranscipted = false;

    output = "";
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
  {#if !audioFile}
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

  {#if audioFile}
    <div
      class={`flex items-center justify-between p-2 border rounded-lg shadow-sm mt-2 ${isUploading ? "bg-transparent" : "bg-cyan-100"}`}
    >
      <div class="flex items-center">
        <div class="flex-shrink-0 p-2 rounded-md">
          {@html svgIcons.document}
        </div>
        <div class="ml-4">
          <p class="font-medium">{audioFile.name}</p>
          <p class="text-sm text-gray-500">
            {audioFile ? bytesToMegabytes(audioFile.size) + " MB" : ""}
          </p>
        </div>
        <p class="font-medium ml-16">{"00:00 min"}</p>
      </div>
      <div class="flex items-center space-x-6">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            {#if !isUploaded}
              {@html svgIcons.uploading}
              <p class="font-medium">{"Uploading..."}</p>
            {/if}
            {#if isTranscribing}
              <span class="loading loading-spinner loading-md"></span>
              <p class="font-medium">{"transcribing"}</p>
            {/if}
            {#if isTranscipted}
              {@html svgIcons.transcribed}
              <p class="font-medium">{"transcribed"}</p>
            {/if}
          </div>
          <button
            on:click|preventDefault={removeFile}
            class="text-gray-500 hover:text-gray-700"
          >
            {@html svgIcons.x}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <div class="mt-8 flex items-center space-x-4">
    {#if !isTranscipted}
      <button
        class={`btn btn-active btn-primary`}
        disabled={!isUploaded || isTranscribing}
        on:click={transcribe}
        >{t("transciption.model.cta.start-transcribing")}</button
      >
    {/if}
    {#if isTranscipted}
      <button class="btn btn-success" on:click={downloadFile}
        >{t("transciption.model.cta.download-output")}</button
      >
      <button class="btn btn-active" on:click={confirmStartNew}
        >{t("transciption.model.cta.start-new-transciption")}</button
      >
    {/if}
  </div>

  <!-- testing purpose -->
  {#if output}
    <div class="mt-5">{output}</div>
  {/if}

  <StartNewConfirmDialog
    bind:modal={confirmModal}
    on:download={downloadFile}
    on:confirm={startNew}
  />
</div>
