<script lang="ts">
  import { onMount } from "svelte";
  import TextOuput from "./TextOuput.svelte";
  import StartNewConfirmDialog from "./StartNewConfirmDialog.svelte";
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  import { tenant } from "$stores";
  import transcript from "$stores/transcript";
  import { addToast } from "$stores/toast";

  const t = useTranslations();

  // general
  let audioFile: File | undefined;
  let audioDuration: string = "";
  let acceptedTypes: Array<string> = ["audio/*", "video/*"];
  let isDragOver: boolean = false;
  let textOuput: string = "";
  let srtFileUrl: string = "";
  let fileErrorMessage: string = "";

  // states
  let isUploading: boolean = false;
  let isUploaded: boolean = false;
  let isTranscribing: boolean = false;
  let isTranscipted: boolean = false;
  let isTranscriptionFailed: boolean = false;

  // API, polling
  let intervalId: any;
  let tempUploadUrl: string;
  let tempOutputFileNames: string[] = [];

  let confirmModal: HTMLDialogElement;

  onMount(async () => {
    console.log("TranscriptionForm::onMount transcript in store", $transcript);
    if ($transcript) {
      retrieveDataInStore();
    }

    // subscribe values change
    transcript.subscribe((value) => {
      if (value?.srtUrl) {
        srtFileUrl = value.srtUrl;
        textOuput = value.txtOuput;

        isTranscribing = false;
        isTranscipted = true;
        isTranscriptionFailed = false;
      }
    });
  });

  function retrieveDataInStore() {
    audioFile = $transcript?.file;
    srtFileUrl = $transcript?.srtUrl as string;

    if (!srtFileUrl) {
      isTranscribing = true;
      isTranscriptionFailed = false;
    } else {
      isUploaded = true;
      isTranscipted = true;
      isTranscriptionFailed = false;
    }
  }

  function isFileTypeValid(type: string) {
    for (let i = 0; i < acceptedTypes.length; i++) {
      const acceptedType = acceptedTypes[i];
      const typeCategory = type?.split("/")?.[0];
      if (acceptedType.includes(typeCategory)) {
        fileErrorMessage = "";
        return true;
      }
    }
    fileErrorMessage = t("transcription.file-validation.unsupported-type");
    return false;
  }

  function isFileSizeValid(size: number) {
    if (size <= 25 * 1024 * 1024) {
      fileErrorMessage = "";
      return true;
    }
    fileErrorMessage = t("transcription.file-validation.exceed-size-limit");
    return false;
  }

  function isFileValid({ size, type }: any) {
    if (isFileTypeValid(type) && isFileSizeValid(size)) {
      return true;
    }
    return false;
  }

  function bytesToMegabytes(bytes: number) {
    const megabytes = bytes / (1024 * 1024);
    return megabytes.toFixed(1);
  }

  function formatFilename(name: string) {
    // replace special characters
    let str = name.replace(/[&\/\#\=\`!,+()$~%.'":@^*?<>{}]/g, "");

    // replace whitespaces
    str = str.replace(/\s/g, "-");

    // replace multiple consecutive hyphens with one
    str = str.replace(/-+/g, "-");

    return str;
  }

  async function getSASToken(fileNameWithoutExtension: string) {
    const response: any = await fetch("/.netlify/functions/getSASToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileNameWithoutExtension: fileNameWithoutExtension,
      }),
    });
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

  async function calculateDuration(file: File): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const url = URL.createObjectURL(file);
        const audio = new Audio(url);
        audio.addEventListener("loadedmetadata", () => {
          const minutes = Math.floor(audio.duration / 60);
          const seconds = Math.floor(audio.duration % 60);
          const duration = `${minutes}:${seconds.toString().padStart(2, "0")} min`;
          URL.revokeObjectURL(url);
          resolve(duration);
        });
      } catch (error) {
        console.error("Calculate duration error", error);
        resolve("");
      }
    });
  }

  async function addFiles(
    event: Event & { currentTarget: EventTarget & HTMLInputElement },
  ) {
    audioDuration = "";
    const eventTarget = event.target as HTMLInputElement;
    audioFile = eventTarget?.files?.[0];

    if (!audioFile) {
      return;
    }

    console.log("Selected audio file", audioFile);
    const { name, size, type } = audioFile;
    if (isFileValid({ name, size, type })) {
      // Calculate duration for audio/video file
      audioDuration = await calculateDuration(audioFile);

      isUploading = true;

      // Get Azure Storage SAS tokens
      let fileNameWithoutExtension = audioFile.name || "";
      const splitedFileName = fileNameWithoutExtension.split(".");
      if (splitedFileName && splitedFileName?.[0]) {
        fileNameWithoutExtension = formatFilename(splitedFileName?.[0]);
      }
      console.log("fileNameWithoutExtension", fileNameWithoutExtension);
      const { uploadUrl, outputFileName } = await getSASToken(
        fileNameWithoutExtension,
      );
      console.log("Azue SAS tokens response", { uploadUrl, outputFileName });

      // Upload the file to Azure Blob Storage
      const response = await uploadBlobFile(uploadUrl, audioFile);

      // Store temporary upload URL, filename for later
      tempUploadUrl = uploadUrl;
      tempOutputFileNames = [`${outputFileName}.txt`, `${outputFileName}.srt`];
      console.log("Temp output file name", tempOutputFileNames);

      if (response.ok) {
        isUploading = false;
        isUploaded = true;
      }
    } else {
      isUploading = false;
      audioFile = undefined;
    }
  }

  async function transcribe() {
    try {
      isTranscribing = true;
      isTranscriptionFailed = false;

      const response = await fetch(
        "/.netlify/functions/transcribeAudio-background",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: audioFile?.name,
            uniqueName: tempOutputFileNames[0],
            uploadUrl: tempUploadUrl,
            instructionSubtitle: $tenant?.instructions?.transcription_subtitle,
            instructionPlaintext:
              $tenant?.instructions?.transcription_plaintext,
            encryptedApiKey: $tenant?.azure_openai_api_key,
            azureOpenAIInstanceName: $tenant?.azure_openai_instance_name,
            azureOpenAIEndpoint: $tenant?.azure_openai_endpoint,
            azureOpenAIWhisperModel: $tenant?.azure_openai_whisper_model,
            azureOpenAIChatModel: $tenant?.azure_openai_chat_model,
          }),
        },
      );

      console.log("Upload audio background response", {
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        startPolling();

        transcript.set({
          file: audioFile,
          duration: audioDuration,
          txtOuput: "",
          txtUrl: "",
          srtUrl: "",
        });
        addToast({
          message: `${t("transcription.file-uploaded-success")}`,
          type: "success",
          timeout: 5000,
        });
      } else {
        const result = await response.json();
        addToast({
          message: result.message || "An error occurred during transcription.",
          type: "error",
          timeout: 5000,
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      addToast({
        message:
          "Failed to upload the file. Please check your network connection.",
        type: "error",
        timeout: 5000,
      });
    }
  }

  async function checkOutputFileReady() {
    try {
      const response = await fetch("/.netlify/functions/checkFileExist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileNames: tempOutputFileNames }),
      });
      if (response.ok) {
        const result = await response.json();
        console.log("Check output file ready response", result);
        if (result.status === "completed") {
          // Note: Handle complete status later on
        } else if (result.status === "failed") {
          clearInterval(intervalId);
          addToast({
            message: result.error || "An error occurred during transcription.",
            type: "error",
            timeout: 5000,
          });
          isTranscribing = false;
          isTranscipted = false;
          isTranscriptionFailed = true;
        }
        if (result.exists) {
          clearInterval(intervalId);
          srtFileUrl = result.srt_file;
          transcript.set({
            file: audioFile,
            duration: audioDuration,
            txtOuput: result.text_output,
            txtUrl: result.txt_file,
            srtUrl: result.srt_file,
          });

          addToast({
            message: `<a href="/transcription">${t("transcription.transcription-is-ready")}</a>`,
            type: "success",
            timeout: 5000,
          });
          console.log("File found!");
        } else {
          console.warn("Still file is processing!");
        }
      } else {
        const result = await response.json();
        if (response.status != 404) {
          addToast({
            message: result.message,
            type: "error",
            timeout: 5000,
          });
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
    transcript.set(null);
    reset();

    confirmModal.close();
  }

  function downloadFile() {
    // Create a link element
    const link = document.createElement("a");

    // Set link's href to point to the Blob URL
    link.href = srtFileUrl;
    link.target = "_blank";
    link.download = `transcribe`;

    // Append link to the body
    document.body.appendChild(link);

    // Dispatch click event on the link
    link.click();

    // Remove link from body
    document.body.removeChild(link);

    // Clsoe dialog element
    console.log("Download file!");
    if (confirmModal.open) {
      confirmModal.close();
    }
  }

  function removeFile() {
    reset();
  }

  function reset() {
    audioFile = undefined;
    isUploading = false;
    isUploaded = false;
    isTranscribing = false;
    isTranscipted = false;
    isTranscriptionFailed = false;

    srtFileUrl = "";
    textOuput = "";
  }
</script>

<div class="px-14 mt-10">
  <div class="bg-base-100 mt-10 p-4 rounded-xl">
    <p class="mb-2">{t("transcription.upload-video-or-audio-file")}</p>
    {#if !audioFile}
      <div class="relative flex flex-col mt-2">
        <label
          class={`py-6 relative flex flex-col text-base-content border border-dashed rounded cursor-pointer ${isDragOver ? "border-blue-500" : "border-neutral-content"} ${fileErrorMessage && "border-red-500 bg-red-100"}`}
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
            accept="audio/*,video/*"
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

        <span class="mt-2 text-xs text-red-500">{fileErrorMessage}</span>
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
              {audioFile?.size ? bytesToMegabytes(audioFile?.size) + " MB" : ""}
            </p>
          </div>
          <p class="font-medium ml-16">{audioDuration}</p>
        </div>
        <div class="flex items-center space-x-6">
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              {#if isUploading && !isUploaded}
                <span class="loading loading-spinner loading-md"></span>
                <p class="font-medium">{t("transciption.uploading")}</p>
              {/if}
              {#if isTranscribing}
                <span class="loading loading-spinner loading-md text-primary"
                ></span>
                <p class="font-medium text-primary">
                  {t("transciption.transcribing")}
                </p>
              {/if}
              {#if isTranscipted}
                {@html svgIcons.transcribed}
                <p class="font-medium text-success">
                  {t("transciption.transcribed")}
                </p>
              {/if}
              {#if isTranscriptionFailed}
                <p class="font-medium text-error">
                  {t("transciption.transcription.failed")}
                </p>
              {/if}
            </div>
            <button
              on:click|preventDefault={removeFile}
              class="text-gray-700 hover:text-primary"
            >
              {@html svgIcons.close}
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>

  {#if textOuput}
    <TextOuput output={textOuput} />
  {/if}

  <div class="mt-8 mb-5 flex items-center space-x-4">
    {#if !isTranscipted}
      <button
        class={`btn btn-active btn-primary btn-sm text-white`}
        disabled={!isUploaded || isTranscribing}
        on:click={transcribe}
        >{t("transciption.model.cta.start-transcribing")}</button
      >
    {/if}
    {#if isTranscipted}
      <button class="btn btn-success btn-sm text-white" on:click={downloadFile}
        >{@html svgIcons.download}{t(
          "transciption.model.cta.download-output",
        )}</button
      >
      <button class="btn bg-black btn-sm text-white" on:click={confirmStartNew}
        >{t("transciption.model.cta.start-new-transciption")}</button
      >
    {/if}
  </div>

  <StartNewConfirmDialog
    bind:modal={confirmModal}
    on:download={downloadFile}
    on:confirm={startNew}
  />
</div>
