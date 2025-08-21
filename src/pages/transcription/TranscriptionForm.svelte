<script lang="ts">
  import { onMount } from "svelte";
  import { slide, fly } from "svelte/transition";
  import TextOuput from "./TextOuput.svelte";
  import StartNewConfirmDialog from "./StartNewConfirmDialog.svelte";
  import SubtitleEditor from "$components/SubtitleEditor.svelte";
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  import { tenant, user } from "$stores";
  import transcriptStore from "$stores/transcript";
  import { addToast } from "$stores/toast";
  import { type TranscribeRequest, FileFormat } from "$types/TranscribeRequest";
  import { TranscriptionType } from "$types/TranscribeRequest";
  import { AudioCategory, TenantFeature } from "$types/TenantFeature";
  import { preventDefault } from "$utils/common";
  import {
    convertToMono,
    type ConvertToMonoConfig,
    type ConvertToMonoCallbacks,
  } from "$api/audio/mono-converter-api";

  const t = useTranslations();

  type Item = { title: string; checked: boolean };
  interface Props {
    transcriptionType?: TranscriptionType | undefined;
    folderName?: string;
    usecaseId?: string;
    category: AudioCategory;
  }

  let {
    transcriptionType = undefined,
    folderName = "",
    usecaseId,
    category,
  }: Props = $props();
  // general
  let audioFile: File | undefined = $state();
  let audioDuration: string = $state("");
  let acceptedTypes: Array<string> = ["audio/*", "video/*"];
  let acceptedTypesJSON: Array<string> = ["application/json"];
  let acceptTypes: string = $state("");
  let maxFileSize = 25;
  let isDragOver: boolean = $state(false);
  let textOuput: string = $state("");
  let txtFileUrl: string = $state("");
  let srtFileUrl: string = $state("");
  let assFileUrl: string = $state("");
  let jsonFileUrl: string = $state("");
  let zipFileData: string = $state("");

  let isZipDataPresent: boolean = $state(false);
  let isFileDataPresent: boolean = $state(false);

  let fileErrorMessage: string = $state("");
  let selectedFileFormat: FileFormat[] = [FileFormat.ASS];

  let standardSubtitlesChecked: boolean = $state(true);
  let showTextPreviewChecked: boolean = $state(true);
  let rawOutputChecked: boolean = $state(false);

  // states
  let isUploading: boolean = $state(false);
  let uploadingValue: number = $state(0);
  let isUploaded: boolean = $state(false);
  let isTranscribing: boolean = $state(false);
  let isTranscipted: boolean = $state(false);
  let isTranscriptionFailed: boolean = $state(false);

  // Stream response
  let conversionStatus = $state("");
  let isConverting = $state(false);

  // API, polling
  let intervalId: any;
  let tempUploadUrl: string;
  let tempOutputFileName: string;
  let tempOutputFileNames: string[] = [];

  let maxNumberOfSpeakers = $state(2);
  let isDiarizationEnabled = $state(false);
  let minSpeakers = 2;
  let maxSpeakers = 20;

  let isAudioTagEnabled = $state(false);

  let confirmModal: HTMLDialogElement | undefined = $state();
  let subtitleEditorModal: HTMLDialogElement | undefined = $state();
  let showSubtitleEditor: boolean = $state(false);

  let assFileChecked = $state(selectedFileFormat.includes(FileFormat.ASS));
  let srtFileChecked = $state(selectedFileFormat.includes(FileFormat.SRT));
  let jsonFileChecked = $state(selectedFileFormat.includes(FileFormat.JSON));
  let txtFileChecked = $state(selectedFileFormat.includes(FileFormat.TXT));

  let languageLocales = $state([
    { title: "Deutsch (Schweiz)", checked: true, locales: "de-ch" },
    {
      title: "Deutsch (Deutschland)",
      checked: false,
      locales: "de-de",
    },
    { title: "Italienisch (Schweiz)", checked: false, locales: "it-ch" },
    { title: "Italienisch (Italien)", checked: false, locales: "it-it" },
    { title: "Französisch (Schweiz)", checked: false, locales: "fr-ch" },
    { title: "Französisch (Frankreich)", checked: false, locales: "fr-fr" },
    { title: "Englisch (US)", checked: false, locales: "en-us" },
    { title: "Englisch (UK)", checked: false, locales: "en-gb" },
  ]);
  const langSelectionValue = $derived(
    languageLocales
      .filter((e) => e.checked === true)
      .map((e) => e.title)
      .join(", "),
  );

  const selectedLangLength = $derived(
    languageLocales.filter((e) => e.checked === true).length,
  );

  let isM4AFile = $derived(
    audioFile
      ? ["m4a", "mp4"].includes(
          audioFile.name.split(".").pop()?.toLowerCase() || "",
        )
      : false,
  );

  function handleSelectedItems(selected: any) {
    const elem = document.activeElement;
    if (elem) {
      elem?.blur();
    }
    const idx = languageLocales.indexOf(selected);
    if (idx !== -1) {
      languageLocales.forEach((item) => (item.checked = false));
      languageLocales[idx].checked = !languageLocales[idx].checked;
    }
    languageLocales = [...languageLocales].sort(
      (a, b) => Number(b.checked) - Number(a.checked),
    );
  }

  onMount(async () => {
    console.log(
      "TranscriptionForm::onMount transcriptStore in store",
      $transcriptStore,
    );

    if (category === AudioCategory.AudioPro) {
      maxFileSize = 1000;
      //maxFileSize = 25; // this is for testing purpose
    }

    if (
      category === AudioCategory.SubtitleLarge ||
      category === AudioCategory.Subtitle11Labs
    ) {
      maxFileSize = 50;
    }

    if ($transcriptStore && transcriptionType) {
      retrieveDataInStore(transcriptionType);
    }

    transcriptStore.subscribe((value) => {
      const entry = value.find((entry) =>
        usecaseId
          ? entry.usecaseId === usecaseId
          : entry.type === transcriptionType,
      );
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
    acceptTypes =
      category === AudioCategory.SubtitleJson
        ? acceptedTypesJSON.join(",")
        : acceptedTypes.join(",");
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
    const entry = $transcriptStore.find((entry) =>
      usecaseId
        ? entry.usecaseId === usecaseId
        : entry.type === transcriptionType,
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
    }
  }

  function isFileTypeValid(type: string): boolean {
    if (!type) {
      fileErrorMessage = t("transcription.file-validation.unsupported-type");
      return false;
    }
    const acceptedFileTypes =
      category === AudioCategory.SubtitleJson
        ? acceptedTypesJSON
        : acceptedTypes;

    const typeCategory = type?.split("/")?.[0];
    const isValid = acceptedFileTypes.some((acceptedType) =>
      acceptedType.includes(typeCategory),
    );

    fileErrorMessage = isValid
      ? ""
      : t("transcription.file-validation.unsupported-type");

    return isValid;
  }

  function isFileSizeValid(size: number) {
    if (size <= maxFileSize * 1024 * 1024) {
      fileErrorMessage = "";
      return true;
    }
    if (
      category === AudioCategory.SubtitleLarge ||
      category === AudioCategory.Subtitle11Labs
    ) {
      fileErrorMessage = t(
        "transcription.file-validation.exceed-size-50-limit",
      );
    } else {
      fileErrorMessage = t("transcription.file-validation.exceed-size-limit");
    }
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
        category: category,
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

    const { name, size, type } = audioFile;
    if (isFileValid({ name, size, type })) {
      // Calculate duration for audio/video file
      if (category !== AudioCategory.SubtitleJson) {
        audioDuration = await calculateDuration(audioFile);
      }

      isUploading = true;

      // Get Azure Storage SAS tokens
      let fileNameWithoutExtension = audioFile.name || "";
      let fileExtension = audioFile.name || "";
      const splitedFileName = fileNameWithoutExtension.split(".");
      if (splitedFileName) {
        if (splitedFileName?.[0]) {
          fileNameWithoutExtension = formatFilename(splitedFileName?.[0]);
        }
        if (splitedFileName?.[1]) {
          fileExtension = splitedFileName?.[splitedFileName?.length - 1];
        }
      }
      const { uploadUrl, outputFileName } = await getSASToken(
        fileNameWithoutExtension,
        fileExtension,
      );
      console.log("Azue SAS tokens response", { uploadUrl, outputFileName });

      try {
        //const response = await uploadBlobFile(uploadUrl, audioFile);
        await uploadBlobFileWithProgress(uploadUrl, audioFile, (percentage) => {
          uploadingValue = parseInt(`${Math.round(percentage)}`);
        })
          .then(() => {
            // Store temporary upload URL, filename for later
            tempUploadUrl = uploadUrl;
            tempOutputFileName = outputFileName;
            if (
              audioFile &&
              isM4AFile &&
              category === AudioCategory.SubtitleLarge
            ) {
              tempOutputFileNames = [
                `${outputFileName}-mono.txt`,
                `${outputFileName}-mono.srt`,
              ];
            } else {
              tempOutputFileNames = [
                `${outputFileName}.txt`,
                `${outputFileName}.srt`,
              ];
            }

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
    const filename = tempUploadUrl.includes("?")
      ? tempUploadUrl.split("?")[0]
      : tempUploadUrl;
    const fileExtension = filename.split(".").pop();
    if (
      (isDiarizationEnabled ||
        fileExtension === "m4a" ||
        fileExtension === "mp4") &&
      (category === AudioCategory.SubtitleLarge ||
        category === AudioCategory.AudioPro)
    ) {
      startPollingConversionFile();
    } else {
      await startTranscription();
    }
  }

  async function startPollingConversionFile() {
    try {
      isTranscribing = true;
      isConverting = true;
      isTranscriptionFailed = false;
      conversionStatus = "Starting conversion...";

      console.log("Starting conversion to mono...");

      // Get API configuration (your existing code)
      const configResponse = await fetch(
        "/.netlify/functions/getTranscriptionConfig",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!configResponse.ok) {
        throw new Error("Failed to get transcription configuration");
      }

      const { apiKey, apiUrl: baseUrl } = await configResponse.json();
      const accessToken = $user?.auth0_access_token;
      if (!accessToken) {
        addToast({
          message: 'Your session has expired. Please log in again',
          type: "error",
        });
        setTimeout(() => {
          window.location.href = "/api/logout";
        }, 2000);
        return;
      }

      const config: ConvertToMonoConfig = {
        baseUrl,
        apiKey: accessToken,
        blobName: tempUploadUrl,
        category,
        folderName,
        uniqueName: tempOutputFileName,
      };

      // Use callbacks to handle streaming events
      const result = await convertToMono(config, {
        onProgress: (progress: number) => {
          conversionStatus = `Converting audio... ${progress}%`;
        },
        onComplete: (result) => {
          conversionStatus = "Conversion completed!";
        },
        onError: (error) => {
          console.error("Conversion error:", error);
          conversionStatus = `Error: ${error.message}`;
          addToast({
            message: error.message || "Failed to convert audio file",
            type: "error",
            timeout: 5000,
          });
        },
      });

      isConverting = false;
      // Handle final result (your existing logic)
      if (result.success && result.data) {
        console.log(
          `File converted successfully. New URL: ${result.data.convertedBlobUrl}`,
        );

        tempUploadUrl =
          result.data.convertedSasUrl || result.data.convertedBlobUrl;

        // addToast({
        //   message: `Audio converted successfully! ${((1 - result.data.compressionRatio) * 100).toFixed(1)}% size reduction`,
        //   type: "success",
        //   timeout: 3000,
        // });

        await startTranscription();
      } else {
        console.error("Conversion failed:", result.message);
        addToast({
          message: result.message || "Failed to convert audio file",
          type: "error",
          timeout: 5000,
        });
        isTranscribing = false;
        isTranscriptionFailed = true;
      }
    } catch (error) {
      console.error("Error in conversion process:", error);
      isConverting = false;
      conversionStatus = "Conversion failed";

      addToast({
        message:
          error instanceof Error ? error.message : "Network error occurred",
        type: "error",
        timeout: 5000,
      });
      isTranscribing = false;
      isTranscriptionFailed = true;
    }
  }

  async function startTranscription() {
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
        if (
          category === AudioCategory.Subtitle ||
          category === AudioCategory.SubtitleJson ||
          category === AudioCategory.SubtitleLarge ||
          category === AudioCategory.Subtitle11Labs
        ) {
          selectedFileFormat.forEach((format) => {
            if (
              audioFile &&
              isM4AFile &&
              category === AudioCategory.SubtitleLarge
            ) {
              tempOutputFileNames.push(`${tempOutputFileName}-mono.${format}`);
            } else {
              tempOutputFileNames.push(`${tempOutputFileName}.${format}`);
            }
          });
        }
        startPolling();

        if (transcriptionType) {
          transcriptStore.update((current) => [
            ...current.filter((entry) =>
              usecaseId
                ? entry.usecaseId !== usecaseId
                : entry.type !== transcriptionType,
            ), // Remove old entry based on condition
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
              usecaseId: usecaseId ?? "",
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
    return {
      folderName: folderName,
      fileName: audioFile?.name || "",
      uniqueName: tempOutputFileName,
      uploadUrl: tempUploadUrl,
      tenantId: tenant?._id,
      userId: user?.id,
      category: category,
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
      encryptedElevenLabsKey: tenant?.elevenLabs_api_key,
      isAudioTagEnabled: isAudioTagEnabled,
      isDiarizationEnabled: isDiarizationEnabled,
      maxSpeakers: parseInt(maxNumberOfSpeakers.toString()),
      languageLocales: languageLocales
        .filter((item) => item.checked)
        .map((item) => item.locales),
      usecaseId: usecaseId,
    };
  }

  async function checkOutputFileReady() {
    try {
      const response = await fetch("/.netlify/functions/checkFileExist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: $tenant?._id,
          userId: $user?.id,
          uniqueName: tempOutputFileName,
          fileNames: tempOutputFileNames,
          folderName: folderName,
          showTextPreviewChecked: showTextPreviewChecked,
          typedCategory: category,
          isDiarizationEnabled: isDiarizationEnabled,
          encryptedSpeechKey: $tenant?.speech_api_key,
          isM4AFile: isM4AFile,
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
              ...current.filter((entry) =>
                usecaseId
                  ? entry.usecaseId !== usecaseId
                  : entry.type !== transcriptionType,
              ), // Remove old entry if it exists
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
                usecaseId: usecaseId ?? "",
              },
            ]);
          }
          addToast({
            message:
              category === AudioCategory.AudioPro
                ? `<a href="/transcription/${transcriptionType}">${t("transcription.transcription-is-ready")}</a>`
                : `<a href="/transcription/${usecaseId}">${t("transcription.transcription-is-ready")}</a>`,
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

    if (fileSizeMB <= 25) return Math.min(estimatedTime, 30) * 1000;
    if (fileSizeMB <= 50) return Math.min(estimatedTime, 60) * 1000;
    if (fileSizeMB <= 200) return Math.min(estimatedTime, 120) * 1000;
    if (fileSizeMB <= 500) return Math.min(estimatedTime, 300) * 1000;
    if (fileSizeMB <= 1000) return Math.min(estimatedTime, 600) * 1000;
    return Math.min(estimatedTime, 900) * 1000;
  }

  function startPolling() {
    if (
      category === AudioCategory.AudioPro ||
      category === AudioCategory.SubtitleLarge
    ) {
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
    confirmModal?.showModal();
  }

  function openSubtitleEditor() {
    showSubtitleEditor = true;
    subtitleEditorModal?.showModal();
  }

  function closeSubtitleEditor() {
    showSubtitleEditor = false;
    subtitleEditorModal?.close();
  }

  function handleSubtitleSave(updatedContent: string | any) {
    console.log('Updated subtitle content:', updatedContent);
    
    // Check if this is both formats data
    if (typeof updatedContent === 'object' && updatedContent.isBothFormats) {
      // Handle both formats export - download both files separately
      const { assContent, srtContent } = updatedContent;
      
      // Download ASS file
      const assBlob = new Blob([assContent], { type: 'text/x-ass' });
      const assUrl = URL.createObjectURL(assBlob);
      const assLink = document.createElement('a');
      assLink.href = assUrl;
      assLink.download = 'updated-subtitles.ass';
      document.body.appendChild(assLink);
      assLink.click();
      document.body.removeChild(assLink);
      URL.revokeObjectURL(assUrl);
      
      // Small delay before downloading the second file
      setTimeout(() => {
        // Download SRT file
        const srtBlob = new Blob([srtContent], { type: 'text/srt' });
        const srtUrl = URL.createObjectURL(srtBlob);
        const srtLink = document.createElement('a');
        srtLink.href = srtUrl;
        srtLink.download = 'updated-subtitles.srt';
        document.body.appendChild(srtLink);
        srtLink.click();
        document.body.removeChild(srtLink);
        URL.revokeObjectURL(srtUrl);
      }, 200);

      addToast({
        message: "Both subtitle formats (ASS and SRT) have been downloaded successfully!",
        type: "success",
        timeout: 3000,
      });
      
      // Close the subtitle editor after successful export
      closeSubtitleEditor();
      return;
    }
    
    // Handle regular string content (ASS or SRT)
    const contentString = updatedContent as string;
    
    // Determine file format based on content
    let fileName = 'updated-subtitles';
    let mimeType = 'text/plain';
    
    if (contentString.includes('[Script Info]') || contentString.includes('[V4+ Styles]')) {
      // ASS format detected
      fileName += '.ass';
      mimeType = 'text/x-ass';
    } else if (contentString.includes(' --> ')) {
      // SRT format detected
      fileName += '.srt';
      mimeType = 'text/srt';
    } else {
      // Default to ASS
      fileName += '.ass';
      mimeType = 'text/x-ass';
    }

    // Create and download the file
    const blob = new Blob([contentString], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    URL.revokeObjectURL(url);

    addToast({
      message: "Subtitles have been updated and downloaded successfully!",
      type: "success",
      timeout: 3000,
    });
    
    // Close the subtitle editor after successful export
    closeSubtitleEditor();
  }

  function startNew() {
    if (transcriptionType) {
      transcriptStore.update((current) =>
        current.filter((entry) =>
          usecaseId
            ? entry.usecaseId !== usecaseId
            : entry.type !== transcriptionType,
        ),
      );
    }
    reset();

    confirmModal?.close();
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
    if (confirmModal?.open) {
      confirmModal?.close();
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

        if (confirmModal?.open) {
          confirmModal?.close();
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

      if (confirmModal?.open) {
        confirmModal?.close();
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
  $effect(() => {
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
  });
  // Watch for changes in the checkbox state and update the `selectedFileFormat` array
  $effect(() => {
    toggleFileFormat(FileFormat.ASS, assFileChecked);
  });
  $effect(() => {
    toggleFileFormat(FileFormat.SRT, srtFileChecked);
  });
  $effect(() => {
    toggleFileFormat(FileFormat.JSON, jsonFileChecked);
  });
  $effect(() => {
    toggleFileFormat(FileFormat.TXT, txtFileChecked);
  });
  let isFormValid = $derived(
    assFileChecked ||
      srtFileChecked ||
      jsonFileChecked ||
      txtFileChecked ||
      showTextPreviewChecked,
  );
</script>

<div class="container max-w-6xl mx-auto px-14 mt-10 max-w-6xl">
  <div class="bg-base-100 mt-10 p-4 px-6 rounded-xl">
    <p class="mb-2">{t("transcription.upload-video-or-audio-file")}</p>
    {#if !audioFile}
      <div class="relative flex flex-col mt-2">
        <label
          class={`py-6 relative flex flex-col text-base-content border border-dashed rounded-sm cursor-pointer ${isDragOver ? "border-info" : "border-neutral-content"} ${fileErrorMessage && "border-error/70 bg-error/30"}`}
          ondragover={() => {
            isDragOver = true;
          }}
          ondragleave={() => {
            isDragOver = false;
          }}
          ondrop={() => {
            isDragOver = false;
          }}
        >
          <input
            type="file"
            class="absolute inset-0 z-50 w-full h-full p-0 m-0 outline-hidden opacity-0 cursor-pointer"
            accept={acceptTypes}
            onchange={addFiles}
          />

          <div class="flex flex-col items-center px-4">
            {@html svgIcons.upload}
            <p class="text-base font-semibold text-center">
              {@html t("transcription.input-file-upload-description")}
            </p>
            <p class="text-sm text-base-content/40 mt-1">
              {#if category === AudioCategory.SubtitleJson}
                {t("transcription.supportted-file-extensions-json")}
              {:else}
                {t("transcription.supportted-file-extensions")}
              {/if}
            </p>
            <p class="text-xs text-base-content/40 mt-8">
              {#if category === AudioCategory.AudioPro}
                {t("transcription.maximum-capacity-1gb")}
              {:else if category === AudioCategory.SubtitleLarge || category === AudioCategory.Subtitle11Labs}
                {t("transcription.maximum-capacity-50mb")}
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
        class={`flex items-center justify-between p-2 border rounded-lg shadow-sm mt-2 ${isUploading ? "bg-transparent" : "bg-accent/30"}`}
      >
        <div class="flex items-center">
          <div class="shrink-0 p-2 rounded-md">
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
              onclick={preventDefault(removeFile)}
              class="text-base-content hover:text-primary"
            >
              {@html svgIcons.close}
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
  {#if category === AudioCategory.AudioPro}
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
                oninput={handleInput}
              />
              <div class="flex flex-col">
                <button
                  class="btn btn-xs btn-ghost"
                  onclick={() => {
                    checkNumberInput(maxNumberOfSpeakers, 1);
                  }}
                  aria-label="Speakers Number Increment"
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
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <button
                  class="btn btn-xs btn-ghost"
                  onclick={() => {
                    checkNumberInput(maxNumberOfSpeakers, -1);
                  }}
                  aria-label="Speakers Number Decrement"
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

  {#if category === AudioCategory.Subtitle || category === AudioCategory.SubtitleJson || category === AudioCategory.SubtitleLarge || category === AudioCategory.Subtitle11Labs}
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
          {#if category === AudioCategory.Subtitle || category === AudioCategory.SubtitleLarge || category === AudioCategory.Subtitle11Labs}
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
          {/if}
        </div>
      </div>
    </div>
  {/if}

  {#if category === AudioCategory.Subtitle11Labs}
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
            bind:checked={isAudioTagEnabled}
          />
          <h3 class="text-sm font-medium">
            {t("settings.transcription.elevenLabs-audio-tag")}
          </h3>
        </label>
      </div>
    </div>
  {/if}

  {#if category === AudioCategory.SubtitleLarge || category === AudioCategory.AudioPro}
    <div class="bg-base-100 mt-10 p-4 px-6 rounded-xl">
      <p class="mb-2">{t("audiotools.subtitles.languageSettings")}</p>
      <div class="flex flex-row items-center mt-4 space-x-4">
        <div class="relative flex flex-col max-w-96">
          <div class="dropdown dropdown-bottom min-w-xs">
            <label
              class="input input-bordered flex flex-row items-center gap-2"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="mr-2 flex-none"
              >
                <path
                  d="M13 13L9 9M10.3333 5.66667C10.3333 8.244 8.244 10.3333 5.66667 10.3333C3.08934 10.3333 1 8.244 1 5.66667C1 3.08934 3.08934 1 5.66667 1C8.244 1 10.3333 3.08934 10.3333 5.66667Z"
                  stroke="#111827"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              <input
                type="text"
                placeholder={t(
                  "audiotools.subtitles.select.languageTranscription",
                )}
                value={langSelectionValue}
                role="button"
                class="w-auto min-w-0 font-medium grow"
                readonly
              />
              <svg
                width="12"
                height="7"
                viewBox="0 0 12 7"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="flex-none"
              >
                <path
                  d="M10.6663 1L5.99967 5.66667L1.33301 1"
                  stroke="#111827"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </label>
            {#if languageLocales}
              <ul
                tabindex="-1"
                class="dropdown-content menu bg-base-100 space-y-2 rounded-box z-1 p-2 shadow-sm"
              >
                {#each languageLocales as item}
                  <li transition:slide>
                    <button
                      onclick={preventDefault(() => handleSelectedItems(item))}
                      class={`${item.checked === true ? "bg-primary text-primary-content hover:bg-primary" : "hover:text-neutral"}`}
                    >
                      {item.title}
                    </button>

                    <!-- <label class="flex items-center">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm checkbox-neutral"
                      bind:checked={item.checked}
                      onchange={() => handleSelectedItems(item)}
                    />
                    <span class="font-normal">{item.title}</span>
                  </label> -->
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>
        {#if (category === AudioCategory.SubtitleLarge && selectedLangLength < 1) || (category === AudioCategory.AudioPro && selectedLangLength < 1)}
          <div transition:slide role="alert" class="alert alert-warning">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span> "Wählen Sie mindestens 1 Sprache aus! </span>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if textOuput && showTextPreviewChecked}
    <TextOuput output={textOuput} />
  {/if}

  <div class="mt-8 mb-5 flex items-center space-x-4">
    {#if !isTranscipted}
      <button
        class={`btn btn-active btn-primary`}
        disabled={!isUploaded ||
          !isFormValid ||
          isTranscribing ||
          (category === AudioCategory.SubtitleLarge && selectedLangLength < 1)}
        onclick={transcribe}
        >{t("transciption.model.cta.start-transcribing")}</button
      >
    {/if}
    {#if isTranscipted}
      {#if zipFileData}
        <button class="btn btn-success" onclick={downloadZip}
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
          onclick={downloadFile}
          >{@html svgIcons.download}{t(
            "transciption.model.cta.download-output",
          )}</button
        >
      {/if}
      
      {#if (assFileUrl || srtFileUrl) && audioFile}
        <button
          class="btn btn-primary btn-sm"
          onclick={openSubtitleEditor}
        >
          {@html svgIcons.edit} Edit Subtitles
        </button>
      {/if}
      
      <button class="btn bg-neutral btn-sm text-white" onclick={confirmStartNew}
        >{t("transciption.model.cta.start-new-transciption")}</button
      >
    {/if}
  </div>

  <StartNewConfirmDialog
    bind:modal={confirmModal}
    bind:isZipDataPresent
    bind:isFileDataPresent
    {downloadZip}
    {downloadFile}
    confirm={startNew}
  />

  <!-- Subtitle Editor Modal -->
  <dialog bind:this={subtitleEditorModal} class="modal">
    <div class="modal-box max-w-7xl w-11/12 h-5/6 max-h-none p-0">
      {#if showSubtitleEditor}
        <SubtitleEditor
          {srtFileUrl}
          {assFileUrl}
          {audioFile}
          onSave={handleSubtitleSave}
          onClose={closeSubtitleEditor}
        />
      {/if}
    </div>
    <form method="dialog" class="modal-backdrop">
      <button onclick={closeSubtitleEditor}>close</button>
    </form>
  </dialog>

  {#if isConverting}
    <div class="conversion-progress" transition:slide>
      <p class="progress-status">{conversionStatus}</p>
    </div>
  {/if}
</div>
