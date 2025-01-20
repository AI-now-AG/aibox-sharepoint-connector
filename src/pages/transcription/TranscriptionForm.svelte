<script lang="ts">
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import TextOuput from "./TextOuput.svelte";
  import StartNewConfirmDialog from "./StartNewConfirmDialog.svelte";
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  import { tenant, user } from "$stores";
  import transcriptStore from "$stores/transcript";
  import { addToast } from "$stores/toast";
  import { type TranscribeRequest, FileFormat } from "$types/TranscribeRequest";
  import { TranscriptionType } from "$types/TranscribeRequest";
  import { TenantFeature } from "$types/TenantFeature";
  const t = useTranslations();

  export let folderName = "";
  export let transcriptionType: TranscriptionType | undefined = undefined;
  // general
  let audioFile: File | undefined;
  let audioDuration: string = "";
  let acceptedTypes: Array<string> = ["audio/*", "video/*"];
  let maxFileSize = 25;
  let isDragOver: boolean = false;
  let textOuput: string = "";
  let txtFileUrl: string = "";
  let srtFileUrl: string = "";
  let assFileUrl: string = "";
  let jsonFileUrl: string = "";
  let zipFileData: string = "";
  let usedModel: string = "";

  let isZipDataPresent: boolean = false;
  let isFileDataPresent: boolean = false;

  let fileErrorMessage: string = "";
  let selectedFileFormat: FileFormat[] = [FileFormat.ASS];

  let standardSubtitlesChecked: boolean = true;
  let showTextPreviewChecked: boolean = true;
  let rawOutputChecked: boolean = false;

  // states
  let isUploading: boolean = false;
  let uploadingValue: number = 0;
  let isUploaded: boolean = false;
  let isTranscribing: boolean = false;
  let isTranscipted: boolean = false;
  let isTranscriptionFailed: boolean = false;

  // API, polling
  let intervalId: any;
  let tempUploadUrl: string;
  let tempOutputFileName: string;
  let tempOutputFileNames: string[] = [];

  let maxNumberOfSpeakers = 2;
  let isDiarizationEnabled = false;
  let minSpeakers = 2;
  let maxSpeakers = 20;

  let confirmModal: HTMLDialogElement;

  let assFileChecked = selectedFileFormat.includes(FileFormat.ASS);
  let srtFileChecked = selectedFileFormat.includes(FileFormat.SRT);
  let jsonFileChecked = selectedFileFormat.includes(FileFormat.JSON);
  let txtFileChecked = selectedFileFormat.includes(FileFormat.TXT);

  // Watch for changes in the checkbox state and update the `selectedFileFormat` array
  $: toggleFileFormat(FileFormat.ASS, assFileChecked);
  $: toggleFileFormat(FileFormat.SRT, srtFileChecked);
  $: toggleFileFormat(FileFormat.JSON, jsonFileChecked);
  $: toggleFileFormat(FileFormat.TXT, txtFileChecked);

  $: isFormValid =
    assFileChecked ||
    srtFileChecked ||
    jsonFileChecked ||
    txtFileChecked ||
    showTextPreviewChecked;

  onMount(async () => {
    console.log(
      "TranscriptionForm::onMount transcriptStore in store",
      $transcriptStore,
    );

    if (transcriptionType == TranscriptionType.Largefile) {
      maxFileSize = 1000;
      //maxFileSize = 25; // this is for testing purpose
    }

    if ($transcriptStore && transcriptionType) {
      retrieveDataInStore(transcriptionType);
    }

    transcriptStore.subscribe((value) => {
      const entry = value.find((entry) => entry.type === transcriptionType);
      if (entry) {
        let options = entry.options;
        if (
          options.txtOuput ||
          options.txtUrl ||
          options.srtUrl ||
          options.assUrl ||
          options.jsonUrl ||
          options.zipFile
        ) {
          // Retrieve the specific entry based on transcriptionType
          txtFileUrl = options.txtUrl;
          srtFileUrl = options.srtUrl;
          assFileUrl = options.assUrl;
          jsonFileUrl = options.jsonUrl;
          zipFileData = options.zipFile;
          textOuput = options.txtOuput;

          checkDataAvaibility();

          isTranscribing = false;
          isTranscipted = true;
          isTranscriptionFailed = false;
        }
      }
    });
  });

  function checkDataAvaibility() {
    isZipDataPresent = zipFileData !== "";
    isFileDataPresent =
      txtFileUrl !== "" ||
      srtFileUrl !== "" ||
      assFileUrl !== "" ||
      jsonFileUrl !== "";
  }

  function retrieveDataInStore(transcriptionType: TranscriptionType) {
    const entry = $transcriptStore.find(
      (entry) => entry.type === transcriptionType,
    );
    if (entry) {
      let options = entry.options;
      audioFile = options.file;
      if (
        options.txtOuput ||
        options.txtUrl ||
        options.srtUrl ||
        options.assUrl ||
        options.jsonUrl ||
        options.zipFile
      ) {
        // Retrieve the specific entry based on transcriptionType
        txtFileUrl = options.txtUrl;
        srtFileUrl = options.srtUrl;
        assFileUrl = options.assUrl;
        jsonFileUrl = options.jsonUrl;
        zipFileData = options.zipFile;
        textOuput = options.txtOuput;
        checkDataAvaibility();
      }

      let isPresent =
        !txtFileUrl ||
        !srtFileUrl ||
        !assFileUrl ||
        !jsonFileUrl ||
        !zipFileData ||
        !textOuput;
      if (isPresent) {
        isTranscribing = true;
        isTranscriptionFailed = false;
      } else {
        isUploaded = true;
        isTranscipted = true;
        isTranscriptionFailed = false;
      }
      // audioFile = entry.options.file;
      // txtFileUrl = entry.options.txtUrl;
      // srtFileUrl = entry.options.srtUrl;
      // assFileUrl = entry.options.assUrl;
      // jsonFileUrl = entry.options.jsonUrl;
      // zipFileData = entry.options.zipFile;

      // if (!textOuput) {
      //   isTranscribing = true;
      //   isTranscriptionFailed = false;
      // } else {
      //   isUploaded = true;
      //   isTranscipted = true;
      //   isTranscriptionFailed = false;
      // }
    }
  }

  /*function retrieveDataInStore() {
    audioFile = $transcript?.file;
    txtFileUrl = $transcript?.txtUrl as string;
    srtFileUrl = $transcript?.srtUrl as string;
    assFileUrl = $transcript?.assUrl as string;
    jsonFileUrl = $transcript?.jsonUrl as string;
    zipFileData = $transcript?.zipFile as string;

    if (!textOuput) {
      isTranscribing = true;
      isTranscriptionFailed = false;
    } else {
      isUploaded = true;
      isTranscipted = true;
      isTranscriptionFailed = false;
    }
  }*/

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
    if (size <= maxFileSize * 1024 * 1024) {
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

  async function getSASToken(
    fileNameWithoutExtension: string,
    fileExtension: string,
  ) {
    const response: any = await fetch("/.netlify/functions/getSASToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileNameWithoutExtension: fileNameWithoutExtension,
        fileExtension: fileExtension,
        folderName: folderName,
        transcriptionType: transcriptionType,
      }),
    });
    return await response.json();
  }

  async function uploadBlobFileWithProgress(
    uploadUrl: string,
    file: File,
    onProgress: (percentage: number) => void,
  ) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentage = (event.loaded / event.total) * 100;
          onProgress(percentage);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Failed to upload file. Status: ${xhr.status}`));
        }
      };

      xhr.onerror = () =>
        reject(new Error("An error occurred during the file upload."));
      xhr.send(file);
    });
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
          if (isNaN(audio.duration)) {
            reject(new Error("Could not determine audio duration."));
            return;
          }

          const minutes = Math.floor(audio.duration / 60);
          const seconds = Math.floor(audio.duration % 60);
          const duration = `${minutes}:${seconds.toString().padStart(2, "0")} min`;
          URL.revokeObjectURL(url);
          resolve(duration);
        });

        audio.addEventListener("error", () => {
          URL.revokeObjectURL(url);
          addToast({
            message: "Failed to load audio metadata.",
            type: "error",
            timeout: 5000,
          });
          resolve("unknown");
          //reject(new Error("Failed to load audio metadata."));
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
      let fileExtension = audioFile.name || "";
      const splitedFileName = fileNameWithoutExtension.split(".");
      console.log("fileNameWithoutExtension---", splitedFileName);
      if (splitedFileName) {
        if (splitedFileName?.[0]) {
          fileNameWithoutExtension = formatFilename(splitedFileName?.[0]);
        }
        if (splitedFileName?.[1]) {
          fileExtension = splitedFileName?.[splitedFileName?.length - 1];
        }
      }
      console.log("fileNameWithoutExtension", fileNameWithoutExtension);
      const { uploadUrl, outputFileName } = await getSASToken(
        fileNameWithoutExtension,
        fileExtension,
      );
      console.log("Azue SAS tokens response", { uploadUrl, outputFileName });

      try {
        // Store temporary upload URL, filename for later
        console.log("Temp output file name", tempOutputFileName);
        // Upload the file to Azure Blob Storage
        //const response = await uploadBlobFile(uploadUrl, audioFile);
        await uploadBlobFileWithProgress(uploadUrl, audioFile, (percentage) => {
          uploadingValue = parseInt(`${Math.round(percentage)}`);
        })
          .then(() => {
            // Store temporary upload URL, filename for later
            tempUploadUrl = uploadUrl;
            tempOutputFileName = outputFileName;
            tempOutputFileNames = [
              `${outputFileName}.txt`,
              `${outputFileName}.srt`,
            ];
            console.log("Temp output file name", tempOutputFileNames);

            isUploading = false;
            isUploaded = true;
          })
          .catch((error) => {
            console.error("Error uploading file:", error);
            isUploading = false;
            audioFile = undefined;
          });
      } catch (error) {
        console.log(error);
        addToast({
          message:
            error instanceof Error
              ? error.message
              : "An error occurred during upload.",
          type: "error",
          timeout: 5000,
        });
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

      const params: TranscribeRequest = createTranscribeRequest(
        folderName,
        audioFile,
        tempOutputFileName,
        tempUploadUrl,
        $tenant,
        $user,
      );
      console.log(params);
      console.log($user);

      const response = await fetch(
        "/.netlify/functions/transcribeAudio-background",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        },
      );

      console.log("Upload audio background response", {
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        tempOutputFileNames = [];
        if (transcriptionType === TranscriptionType.Subtitles) {
          selectedFileFormat.forEach((format) => {
            tempOutputFileNames.push(`${tempOutputFileName}.${format}`);
          });
        }
        startPolling();

        if (transcriptionType) {
          transcriptStore.update((current) => [
            ...current.filter((entry) => entry.type !== transcriptionType), // Remove old entry if it exists
            {
              type: transcriptionType,
              options: {
                file: audioFile,
                duration: audioDuration,
                txtOuput: "",
                txtUrl: "",
                srtUrl: "",
                assUrl: "",
                jsonUrl: "",
                zipFile: "",
              },
            },
          ]);
        }
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

  function createTranscribeRequest(
    folderName: string,
    audioFile: File | undefined,
    tempOutputFileName: string,
    tempUploadUrl: string,
    tenant: any,
    user: any,
  ): TranscribeRequest {
    const textPromptsProvider = tenant?.included_features?.find(
      (item: { name: any }) => item.name == TenantFeature.AudioToText,
    );
    const provider = textPromptsProvider?.provider;
    usedModel = provider;
    return {
      folderName: folderName,
      fileName: audioFile?.name || "",
      uniqueName: tempOutputFileName,
      uploadUrl: tempUploadUrl,
      transcriptions: tenant?.transcriptions,
      tenantId: tenant?._id,
      userId: user?.id,
      transcriptionType: transcriptionType,
      selectedFileFormat: selectedFileFormat,
      isShowImprovedTextPreview: showTextPreviewChecked,
      apiKeyProvider: provider,
      openaiEncryptedApiKey: tenant?.openai_api_key,
      encryptedApiKey: tenant?.azure_openai_api_key,
      azureOpenAIInstanceName: tenant?.azure_openai_instance_name,
      azureOpenAIEndpoint: tenant?.azure_openai_endpoint,
      azureOpenAIWhisperModel: tenant?.azure_openai_whisper_model,
      azureOpenAIChatModel: tenant?.azure_openai_chat_model,
      encryptedSpeechKey: tenant?.speech_api_key,
      speechRegion: tenant?.speech_region,
      isDiarizationEnabled: isDiarizationEnabled,
      maxSpeakers: parseInt(maxNumberOfSpeakers.toString()),
    };
  }

  async function checkOutputFileReady() {
    try {
      const response = await fetch("/.netlify/functions/checkFileExist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uniqueName: tempOutputFileName,
          fileNames: tempOutputFileNames,
          folderName: folderName,
          isShowImprovedTextPreview:
            transcriptionType === TranscriptionType.Subtitles
              ? showTextPreviewChecked
              : false,
          typedTranscriptionType: transcriptionType,
          isDiarizationEnabled: isDiarizationEnabled,
          encryptedSpeechKey: $tenant?.speech_api_key,
        }),
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
          txtFileUrl = result.txt_file;
          srtFileUrl = result.srt_file;
          assFileUrl = result.ass_file;
          jsonFileUrl = result.json_file;
          zipFileData = result.zip_file;
          checkDataAvaibility();
          if (transcriptionType) {
            transcriptStore.update((current) => [
              ...current.filter((entry) => entry.type !== transcriptionType), // Remove old entry if it exists
              {
                type: transcriptionType,
                options: {
                  file: audioFile,
                  duration: audioDuration,
                  txtOuput: result.text_output,
                  txtUrl: result.txt_file,
                  srtUrl: result.srt_file,
                  assUrl: result.ass_file,
                  jsonUrl: result.json_file,
                  zipFile: result.zip_file,
                },
              },
            ]);
          }
          addToast({
            message: `<a href="/transcription/${transcriptionType}">${t("transcription.transcription-is-ready")}</a>`,
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
          clearInterval(intervalId);
          addToast({
            message: result.error,
            type: "error",
            timeout: 5000,
          });
          isTranscribing = false;
          isTranscipted = false;
          isTranscriptionFailed = true;
        }
      }
    } catch (error) {
      console.error("Check output file ready error", error);
    }
  }

  function getPollingInterval(fileSizeBytes: number): number {
    const fileSizeMB = fileSizeBytes / 1024 / 1024;
    const timePerMB = 60 / 1.7;
    const estimatedTime = timePerMB * fileSizeMB;

    if (fileSizeMB <= 25) return Math.min(estimatedTime, 30) * 1000; // Poll at least every 30 seconds for smaller files
    if (fileSizeMB <= 50) return Math.min(estimatedTime, 60) * 1000; // Poll every 1 minute for medium-smaller files
    if (fileSizeMB <= 200) return Math.min(estimatedTime, 120) * 1000; // Poll every 2 minutes for medium files
    if (fileSizeMB <= 500) return Math.min(estimatedTime, 300) * 1000; // Poll every 5 minutes for larger files
    if (fileSizeMB <= 1000) return Math.min(estimatedTime, 600) * 1000; // Poll every 10 minutes for very large files
    return Math.min(estimatedTime, 900) * 1000; // Poll every 15 minutes for extra-large files
  }

  function startPolling() {
    if (transcriptionType === TranscriptionType.Largefile) {
      let fileSize = audioFile?.size;
      if (fileSize) {
        intervalId = setInterval(
          checkOutputFileReady,
          getPollingInterval(fileSize),
        );
      } else {
        intervalId = setInterval(checkOutputFileReady, getPollingInterval(200));
      }
    } else {
      intervalId = setInterval(checkOutputFileReady, 5000);
    }
  }

  function confirmStartNew() {
    confirmModal.showModal();
  }

  function startNew() {
    if (transcriptionType) {
      transcriptStore.update((current) =>
        current.filter((entry) => entry.type !== transcriptionType),
      );
    }
    reset();

    confirmModal.close();
  }

  function downloadFileSRT() {
    // Create a link element
    const link = document.createElement("a");

    // Set link's href to point to the Blob URL
    link.href = srtFileUrl;
    link.target = "_blank";
    link.download = `transcribe.srt`;

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

  function downloadFile() {
    const fileUrl = assFileUrl || srtFileUrl || jsonFileUrl || txtFileUrl;
    if (!fileUrl) {
      console.error("No file available for download.");
      return;
    }

    fetch(fileUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(
          new Blob([blob], { type: "application/octet-stream" }),
        );

        const fileName = fileUrl.split("/").pop() ?? "";
        const link = document.createElement("a");
        link.href = blobUrl;
        link.target = "_blank";
        link.download = fileName;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

        console.log("Download file!");
        if (confirmModal.open) {
          confirmModal.close();
        }
      })
      .catch((error) => {
        console.error("Error downloading file:", error);
      });
  }

  async function downloadZip() {
    const fileUrl = assFileUrl || srtFileUrl || jsonFileUrl || txtFileUrl;
    if (zipFileData) {
      // Decode the base64 string to binary data
      const zipBuffer = atob(zipFileData); // atob decodes the base64 string to binary string
      const byteArray = new Uint8Array(zipBuffer.length);

      // Fill the byteArray with the binary data
      for (let i = 0; i < zipBuffer.length; i++) {
        byteArray[i] = zipBuffer.charCodeAt(i);
      }

      // Create a Blob from the binary data
      const blob = new Blob([byteArray], { type: "application/zip" });

      // Create a link element to download the Blob
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.target = "_blank";
      link.download = `${tempOutputFileName}.zip`; // Specify the file name

      // Append link to the body
      document.body.appendChild(link);
      link.click(); // Trigger the download

      // Remove link from body
      document.body.removeChild(link);

      // Clsoe dialog element
      console.log("Download file!");
      if (confirmModal.open) {
        confirmModal.close();
      }
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

    txtFileUrl = "";
    srtFileUrl = "";
    assFileUrl = "";
    jsonFileUrl = "";
    zipFileData = "";
    textOuput = "";

    isZipDataPresent = false;
    isFileDataPresent = false;
  }

  $: {
    if (!standardSubtitlesChecked) {
      selectedFileFormat = selectedFileFormat.filter(
        (f) => f !== FileFormat.ASS && f !== FileFormat.SRT,
      );
      assFileChecked = false;
      srtFileChecked = false;
    }

    if (!rawOutputChecked) {
      selectedFileFormat = selectedFileFormat.filter(
        (f) => f !== FileFormat.JSON && f !== FileFormat.TXT,
      );
      jsonFileChecked = false;
      txtFileChecked = false;
    }
  }

  // Handlers to update the array
  function toggleFileFormat(format: FileFormat, checked: boolean) {
    if (checked) {
      if (!selectedFileFormat.includes(format)) {
        selectedFileFormat = [...selectedFileFormat, format];
      }
    } else {
      selectedFileFormat = selectedFileFormat.filter((f) => f !== format);
    }
  }

  function isNumber(value: number) {
    return !isNaN(value);
  }

  function handleInput(e) {
    let oldValue = maxNumberOfSpeakers;
    let newValue = e.target.value;
    checkNumberInput(newValue);
  }

  function checkNumberInput(value: number, increase?: number) {
    let newValue = parseInt(value.toString());
    if (increase) {
      newValue = newValue + parseInt(increase);
    }
    if (isNumber(newValue)) {
      if (newValue <= minSpeakers) {
        maxNumberOfSpeakers = minSpeakers;
      } else if (newValue <= maxSpeakers) {
        maxNumberOfSpeakers = newValue;
      } else {
        maxNumberOfSpeakers = maxSpeakers;
      }
    } else {
      if (value.toString() !== "") {
        maxNumberOfSpeakers = minSpeakers;
      }
    }
  }
</script>

<div class="px-14 mt-10">
  <div class="bg-base-100 mt-10 p-4 px-6 rounded-xl">
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

          <div class="flex flex-col items-center px-4">
            {@html svgIcons.upload}
            <p class="text-base font-semibold text-center">
              {@html t("transcription.input-file-upload-description")}
            </p>
            <p class="text-sm text-base-content/40 mt-1">
              {t("transcription.supportted-file-extensions")}
            </p>
            <p class="text-xs text-base-content/40 mt-8">
              {#if transcriptionType === TranscriptionType.Largefile}
                {t("transcription.maximum-capacity-1gb")}
              {:else}
                {t("transcription.maximum-capacity-25mb")}
              {/if}
            </p>
          </div>
        </label>

        <span class="mt-2 text-xs text-error">{fileErrorMessage}</span>
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
            <p class="text-sm text-base-content/60">
              {audioFile?.size ? bytesToMegabytes(audioFile?.size) + " MB" : ""}
            </p>
          </div>
          <p class="font-medium ml-16">{audioDuration}</p>
        </div>
        <div class="flex items-center space-x-6">
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              {#if isUploading && !isUploaded}
                <progress
                  class="progress progress-primary w-56"
                  value={uploadingValue}
                  max="100"
                ></progress>
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
  <p class="p-2 font-bold flex justify-end">{usedModel}</p>
  {#if transcriptionType === TranscriptionType.Largefile}
    <div class="bg-base-100 mt-10 p-4 px-6 rounded-xl">
      <div class="flex flex-col gap-4">
        <h2 class="font-normal">
          {t("settings.transcription.largefile-settings")}
        </h2>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            pattern="[0-9]+"
            class="checkbox checkbox-neutral"
            bind:checked={isDiarizationEnabled}
          />
          <h3 class="text-sm font-medium">
            {t("settings.transcription.largefile-speaker.diarization")}
          </h3>
        </label>

        {#if isDiarizationEnabled}
          <div out:slide in:slide>
            <h2 class="text-base-content/40">
              {t("settings.transcription.largefile-speaker.number")}
            </h2>
            <label
              class="input input-bordered input-lg flex items-center gap-2"
            >
              <input
                type="text"
                class="grow"
                placeholder="Speakers"
                bind:value={maxNumberOfSpeakers}
                on:input={handleInput}
              />
              <div class="flex flex-col">
                <button
                  class="btn btn-xs btn-ghost"
                  on:click={() => {
                    checkNumberInput(maxNumberOfSpeakers, 1);
                  }}
                >
                  <svg
                    width="12"
                    height="7"
                    viewBox="0 0 12 7"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="currentColor"
                  >
                    <path
                      d="M1.33341 6L6.00008 1.33333L10.6667 6"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
                <button
                  class="btn btn-xs btn-ghost"
                  on:click={() => {
                    checkNumberInput(maxNumberOfSpeakers, -1);
                  }}
                >
                  <svg
                    width="12"
                    height="7"
                    viewBox="0 0 12 7"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.6666 1L5.99992 5.66667L1.33325 1"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </label>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if transcriptionType === TranscriptionType.Subtitles}
    <div class="bg-base-100 mt-10 p-4 px-6 rounded-xl">
      <div class="grid">
        <h2>{t("audiotools.subtitles.what-output-do-you-need")}</h2>
        <!-- Standard Subtitles -->
        <div class="form-control py-2">
          <div class="card rounded-box grid py-8">
            <div class="flex flex-row place-items-center gap-8">
              <input
                type="checkbox"
                bind:checked={standardSubtitlesChecked}
                class="checkbox checked:checkbox-primary"
              />
              <div class="basis-1/3">
                <div class="flex flex-row place-items-center gap-4">
                  <div class="avatar placeholder">
                    <div class="bg-base-200 text-neutral p-3 rounded-full">
                      {@html svgIcons.keyboard}
                    </div>
                  </div>

                  <div class="flex flex-col">
                    <h2 class="font-semibold">
                      {t("audiotools.subtitles.subtitle-files")}
                    </h2>
                    <p class="text-base-content/60">
                      {t("audiotools.subtitles.with-text-improvement")}
                    </p>
                  </div>
                </div>
              </div>
              <div class="basis-1/3">
                <div class="flex flex-row place-items-center gap-8">
                  <label class="cursor-pointer label">
                    <input
                      type="checkbox"
                      bind:checked={assFileChecked}
                      class="checkbox checked:checkbox-primary checkbox-xs"
                    />
                    <span class="label-text ml-2">.ass</span>
                  </label>
                  <label class="cursor-pointer label">
                    <input
                      type="checkbox"
                      bind:checked={srtFileChecked}
                      class="checkbox checked:checkbox-primary checkbox-xs"
                    />
                    <span class="label-text ml-2">.srt</span>
                  </label>
                </div>
              </div>
              <!-- <div class="basis-1/8">03</div> -->
            </div>
          </div>
          <div><div class="bg-base-200 h-0.5"></div></div>
          <div class="card rounded-box grid py-8">
            <div class="flex flex-row place-items-center gap-8">
              <input
                type="checkbox"
                bind:checked={showTextPreviewChecked}
                class="checkbox checked:checkbox-primary"
              />
              <div class="basis-1/3">
                <div class="flex flex-row place-items-center gap-4">
                  <div class="avatar placeholder">
                    <div class="bg-base-200 text-neutral p-3 rounded-full">
                      {@html svgIcons.textIcon}
                    </div>
                  </div>

                  <div class="flex flex-col">
                    <h2 class="font-semibold">
                      {t("audiotools.subtitles.show-text-preview")}
                    </h2>
                    <p class="text-base-content/60">
                      {t("tenant.audio-to-text")}
                    </p>
                  </div>
                </div>
              </div>
              <!-- <div class="basis-1/3">02</div>
              <div class="basis-1/8">03</div> -->
            </div>
          </div>
          <div><div class="bg-base-200 h-0.5"></div></div>
          <div class="card rounded-box grid py-8">
            <div class="flex flex-row place-items-center gap-8">
              <input
                type="checkbox"
                bind:checked={rawOutputChecked}
                class="checkbox checked:checkbox-primary"
              />
              <div class="basis-1/3">
                <div class="flex flex-row place-items-center gap-4">
                  <div class="avatar placeholder">
                    <div class="bg-base-200 text-neutral p-3 rounded-full">
                      {@html svgIcons.codeIcon}
                    </div>
                  </div>

                  <div class="flex flex-col">
                    <h2 class="font-semibold">
                      {t("audiotools.subtitles.raw-output")}
                    </h2>
                    <p class="text-base-content/60">
                      {t("audiotools.subtitles.no-text-improvement")}
                    </p>
                  </div>
                </div>
              </div>
              <div class="basis-1/3">
                <div class="flex flex-row place-items-center gap-8">
                  <label class="cursor-pointer label">
                    <input
                      type="checkbox"
                      bind:checked={jsonFileChecked}
                      class="checkbox checked:checkbox-primary checkbox-xs"
                    />
                    <span class="label-text ml-2">.json</span>
                  </label>
                  <label class="cursor-pointer label">
                    <input
                      type="checkbox"
                      bind:checked={txtFileChecked}
                      class="checkbox checked:checkbox-primary checkbox-xs"
                    />
                    <span class="label-text ml-2">.txt</span>
                  </label>
                </div>
              </div>
              <!-- <div class="basis-1/8">03</div> -->
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if textOuput && showTextPreviewChecked}
    <TextOuput output={textOuput} />
  {/if}

  <div class="mt-8 mb-5 flex items-center space-x-4">
    {#if !isTranscipted}
      <button
        class={`btn btn-active btn-primary btn-sm text-base-100`}
        disabled={!isUploaded || !isFormValid || isTranscribing}
        on:click={transcribe}
        >{t("transciption.model.cta.start-transcribing")}</button
      >
    {/if}
    {#if isTranscipted}
      {#if zipFileData}
        <button
          class="btn btn-success btn-sm text-base-100"
          on:click={downloadZip}
          >{@html svgIcons.download}{t(
            "transciption.model.cta.download-zip",
          )}</button
        >
      {:else if assFileUrl || srtFileUrl || jsonFileUrl || txtFileUrl}
        <!-- <button
          class="btn btn-success btn-sm text-base-100"
          on:click={downloadFileSRT}
          >{@html svgIcons.download}{t(
            "transciption.model.cta.download-output.srt",
          )}</button
        > -->
        <button
          class="btn btn-success btn-sm text-base-100"
          on:click={downloadFile}
          >{@html svgIcons.download}{t(
            "transciption.model.cta.download-output",
          )}</button
        >
      {/if}
      <button
        class="btn bg-neutral btn-sm text-white"
        on:click={confirmStartNew}
        >{t("transciption.model.cta.start-new-transciption")}</button
      >
    {/if}
  </div>

  <StartNewConfirmDialog
    bind:modal={confirmModal}
    bind:isZipDataPresent
    bind:isFileDataPresent
    on:downloadZip={downloadZip}
    on:downloadFile={downloadFile}
    on:confirm={startNew}
  />
</div>
