<script lang="ts">
  import { onMount } from "svelte";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import SubtitleEditor from "$components/SubtitleEditor.svelte";
  import {
    generateASSContent,
    generateSRTContent,
  } from "$utils/subtitleParser";

  const t = useTranslations();

  interface UploadedFile {
    file: File;
    url: string;
    type: "ass" | "srt";
  }

  interface Props {
    srtFileUrl?: string;
    assFileUrl?: string;
    audioFileUrl?: string;
    audioFileName?: string;
    hasPreloadedAudio?: boolean;
  }

  let {
    srtFileUrl: preloadedSrtUrlProp = undefined,
    assFileUrl: preloadedAssUrlProp = undefined,
    audioFileUrl,
    audioFileName,
    hasPreloadedAudio,
  }: Props = $props();

  // State variables
  let uploadedFile: UploadedFile | null = $state(null);
  let isDragOver = $state(false);
  let fileErrorMessage = $state("");
  let showEditor = $state(false);
  let isTransitioning = $state(false);
  let preloadedAudioFile: File | undefined = $state();
  let isLoadingAudio = $state(false);
  let preloadedSrtUrl = $state<string | undefined>(preloadedSrtUrlProp);
  let preloadedAssUrl = $state<string | undefined>(preloadedAssUrlProp);

  // Store original filenames for auto-saved files
  let originalAssFileName = $state<string | undefined>();
  let originalSrtFileName = $state<string | undefined>();

  // Derived state - prioritize uploaded file over preloaded URLs
  let assFileUrl = $derived.by(() => {
    if (uploadedFile !== null && uploadedFile.type === "ass") {
      return uploadedFile.url;
    }
    return preloadedAssUrl;
  });
  
  let srtFileUrl = $derived.by(() => {
    if (uploadedFile !== null && uploadedFile.type === "srt") {
      return uploadedFile.url;
    }
    return preloadedSrtUrl;
  });
  
  let hasFiles = $derived(
    !!uploadedFile || !!(preloadedAssUrl || preloadedSrtUrl),
  );

  // File validation
  function validateFile(file: File): string | null {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedExtensions = [".ass", ".srt"];

    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is 10MB.`;
    }

    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return `File "${file.name}" has unsupported format. Only .ass and .srt files are allowed.`;
    }

    return null;
  }

  // Handle file selection - single file only
  function handleFiles(files: FileList) {
    fileErrorMessage = "";

    // Only process the first file (single file upload)
    const file = files[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      fileErrorMessage = error;
      return;
    }

    // Clean up previous file URL if exists
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.url);
    }

    // Create object URL for the new file
    const url = URL.createObjectURL(file);
    const type = file.name.toLowerCase().endsWith(".ass") ? "ass" : "srt";

    uploadedFile = { file, url, type };
  }

  // Remove file
  function removeFile() {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.url);
      uploadedFile = null;
    }
  }

  // File input change handler
  function onFileInputChange(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files) handleFiles(files);
  }

  // Drag and drop handlers
  function onDragOver(event: DragEvent) {
    event.preventDefault();
    isDragOver = true;
  }

  function onDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files) handleFiles(files);
  }

  // Open editor
  function openEditor() {
    isTransitioning = true;
    // Small delay to trigger transition animation
    setTimeout(() => {
      showEditor = true;
    }, 50);
  }

  // Close editor and return to upload
  function closeEditor() {
    isTransitioning = true;
    showEditor = false;
    // Reset transition state after animation completes
    setTimeout(() => {
      isTransitioning = false;
    }, 300);
  }

  // Handle subtitle save/export
  function handleSubtitleSave(
    content:
      | string
      | { assContent: string; srtContent: string; isBothFormats: boolean }
      | { content: string; format: 'srt' | 'ass' },
  ) {
    try {
      function getEditedFileName(url: string | undefined, fallback: string, originalFileName?: string) {
        // Use stored original filename for auto-saved files
        if (originalFileName) {
          const dotIdx = originalFileName.lastIndexOf(".");
          if (dotIdx === -1) return originalFileName + "_edited";
          return originalFileName.slice(0, dotIdx) + "_edited" + originalFileName.slice(dotIdx);
        }

        if (!url) return fallback;
        // Remove query parameters from URL before extracting filename
        const urlWithoutQuery = url.split("?")[0];
        const parts = urlWithoutQuery.split("/");
        const orig = parts[parts.length - 1] || fallback;
        const dotIdx = orig.lastIndexOf(".");
        if (dotIdx === -1) return orig + "_edited";
        return orig.slice(0, dotIdx) + "_edited" + orig.slice(dotIdx);
      }

      function getBaseFilename(filename: string): string {
        // Extract base filename without extension
        const dotIdx = filename.lastIndexOf(".");
        if (dotIdx === -1) return filename;
        return filename.slice(0, dotIdx);
      }

      function changeExtension(filename: string, newExt: string): string {
        // Change the file extension
        const base = getBaseFilename(filename);
        return base + newExt;
      }

      if (typeof content === "string") {
        // Legacy: Single format export (backward compatibility)
        let filename = "edited-subtitles.srt";
        if (assFileUrl) {
          filename = getEditedFileName(assFileUrl, "edited-subtitles.ass", originalAssFileName);
        } else if (srtFileUrl) {
          filename = getEditedFileName(srtFileUrl, "edited-subtitles.srt", originalSrtFileName);
        }
        downloadFile(content, filename);
      } else if ('format' in content && (content.format === 'ass' || content.format === 'srt')) {
        // New: Single format export with explicit format specification
        const ext = content.format;
        const defaultFilename = `edited-subtitles.${ext}`;
        let filename = defaultFilename;

        // Determine source URL and original filename based on format
        const sourceUrl = ext === 'ass' ? assFileUrl : srtFileUrl;
        const originalName = ext === 'ass' ? originalAssFileName : originalSrtFileName;

        if (sourceUrl) {
          filename = getEditedFileName(sourceUrl, defaultFilename, originalName);
          if (!filename.toLowerCase().endsWith(`.${ext}`)) {
            filename = `${filename}.${ext}`;
          }
        }
        downloadFile(content.content, filename);
      } else if ('isBothFormats' in content && content.isBothFormats) {
        // Both formats export
        // Get filenames for both formats, handling cases where only one URL exists
        let assName: string;
        let srtName: string;

        if (originalAssFileName || originalSrtFileName) {
          // Use stored original filenames
          const baseName = originalAssFileName 
            ? getBaseFilename(originalAssFileName)
            : getBaseFilename(originalSrtFileName!);
          assName = baseName + "_edited.ass";
          srtName = baseName + "_edited.srt";
        } else if (assFileUrl || srtFileUrl) {
          // Extract from URL (remove query parameters first)
          const sourceUrl = assFileUrl || srtFileUrl;
          const urlWithoutQuery = sourceUrl!.split("?")[0];
          const parts = urlWithoutQuery.split("/");
          const orig = parts[parts.length - 1];
          const baseName = getBaseFilename(orig);
          assName = baseName + "_edited.ass";
          srtName = baseName + "_edited.srt";
        } else {
          // Fallback to default names
          assName = "edited-subtitles.ass";
          srtName = "edited-subtitles.srt";
        }

        downloadFile(content.assContent, assName);
        setTimeout(() => {
          downloadFile(content.srtContent, srtName);
        }, 100);
      }
    } catch (error) {
      console.error("Error saving subtitle file:", error);
    }
  }

  // Download file helper function
  function downloadFile(content: string, filename: string) {
    // Determine MIME type based on file extension
    let mimeType = "text/plain;charset=utf-8";
    if (filename.toLowerCase().endsWith(".ass")) {
      mimeType = "text/x-ssa;charset=utf-8"; // ASS/SSA subtitle format
    } else if (filename.toLowerCase().endsWith(".srt")) {
      mimeType = "application/x-subrip;charset=utf-8"; // SRT subtitle format
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Calculate file size in MB
  function formatFileSize(bytes: number): string {
    return (bytes / 1024 / 1024).toFixed(2);
  }

  // Load auto-saved data from sessionStorage
  function loadAutoSavedData() {
    try {
      const stored = sessionStorage.getItem('subtitle-editor-autosave');
      if (stored) {
        const data = JSON.parse(stored);

        // Create blob URLs for the saved subtitle content
        if (data.dialogues && data.dialogues.length > 0) {
          // Store original filenames if available
          // Extract base filename to derive both ASS and SRT names
          let baseFileName: string | undefined;

          if (data.assFileUrl) {
            const assUrlParts = data.assFileUrl.split('/');
            originalAssFileName = decodeURIComponent(assUrlParts[assUrlParts.length - 1].split('?')[0]);
            // Extract base name (without extension)
            const dotIdx = originalAssFileName.lastIndexOf(".");
            baseFileName = dotIdx !== -1 ? originalAssFileName.slice(0, dotIdx) : originalAssFileName;
          }
          
          if (data.srtFileUrl) {
            const srtUrlParts = data.srtFileUrl.split('/');
            originalSrtFileName = decodeURIComponent(srtUrlParts[srtUrlParts.length - 1].split('?')[0]);
            // Extract base name if not already set
            if (!baseFileName) {
              const dotIdx = originalSrtFileName.lastIndexOf(".");
              baseFileName = dotIdx !== -1 ? originalSrtFileName.slice(0, dotIdx) : originalSrtFileName;
            }
          }

          // If only one filename was provided, derive the other one from the base name
          if (baseFileName) {
            if (!originalAssFileName) {
              originalAssFileName = baseFileName + ".ass";
            }
            if (!originalSrtFileName) {
              originalSrtFileName = baseFileName + ".srt";
            }
          }

          // Generate ASS content from dialogues
          const assContent = generateASSContent(data.dialogues);
          const assBlob = new Blob([assContent], { type: 'text/x-ssa;charset=utf-8' });
          preloadedAssUrl = URL.createObjectURL(assBlob);

          // Generate SRT content from dialogues
          const srtContent = generateSRTContent(data.dialogues);
          const srtBlob = new Blob([srtContent], { type: 'application/x-subrip;charset=utf-8' });
          preloadedSrtUrl = URL.createObjectURL(srtBlob);

          console.log("Auto-saved subtitle data loaded from sessionStorage");
        }
      }
    } catch (error) {
      console.error("Error loading auto-saved data:", error);
    }
  }

  // Clear auto-saved data
  function clearAutoSavedData() {
    try {
      sessionStorage.removeItem('subtitle-editor-autosave');

      // Clean up blob URLs
      if (preloadedAssUrl && preloadedAssUrl.startsWith('blob:')) {
        URL.revokeObjectURL(preloadedAssUrl);
      }
      if (preloadedSrtUrl && preloadedSrtUrl.startsWith('blob:')) {
        URL.revokeObjectURL(preloadedSrtUrl);
      }

      preloadedAssUrl = "";
      preloadedSrtUrl = "";

      console.log("Auto-saved data cleared");
    } catch (error) {
      console.error("Error clearing auto-saved data:", error);
    }
  }

  // Cleanup URLs on component destroy
  function cleanup() {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.url);
    }
    // Clean up auto-saved URLs
    if (preloadedAssUrl && preloadedAssUrl.startsWith('blob:')) {
      URL.revokeObjectURL(preloadedAssUrl);
    }
    if (preloadedSrtUrl && preloadedSrtUrl.startsWith('blob:')) {
      URL.revokeObjectURL(preloadedSrtUrl);
    }
  }

  // Cleanup when component is destroyed
  $effect(() => {
    return () => cleanup();
  });

  // Handle preloaded files and audio
  onMount(async () => {
    // Only load auto-saved data if no preloaded files are provided
    if (!preloadedSrtUrl && !preloadedAssUrl) {
      loadAutoSavedData();
    }
    // Load preloaded audio file if URL provided
    if (audioFileUrl && audioFileName) {
      isLoadingAudio = true;
      try {
        console.log("Loading preloaded audio file from URL:", audioFileUrl);
        const response = await fetch(audioFileUrl);
        const audioBlob = await response.blob();

        preloadedAudioFile = new File([audioBlob], audioFileName, {
          type: audioBlob.type || "audio/mpeg",
        });
      } catch (error) {
        console.error("Error loading preloaded audio file:", error);
      } finally {
        isLoadingAudio = false;
      }
    }

    // Auto-open editor if we have preloaded subtitle files or auto-saved data
    if (preloadedAssUrl || preloadedSrtUrl) {
      openEditor();
    }
  });
</script>

{#if !showEditor}
  <!-- Upload Section -->
  <div
    class="upload-container bg-base-100 mt-10 p-4 px-6 rounded-xl relative"
    class:fade-out={isTransitioning && showEditor}
  >
    {#if isTransitioning && showEditor}
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
    {/if}

    <p class="mb-2">{t("subtitle-editor.upload-title")}</p>

    <div class="relative flex flex-col mt-2">
      <label
        class={`py-6 relative flex flex-col text-base-content border border-dashed rounded-sm cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
          isDragOver
            ? "border-info bg-info/10 shadow-lg scale-[1.02]"
            : "border-neutral-content hover:border-primary/50 hover:bg-primary/5"
        } ${fileErrorMessage ? "border-error/70 bg-error/30" : ""}`}
        ondragover={onDragOver}
        ondragleave={onDragLeave}
        ondrop={onDrop}
      >
        <input
          type="file"
          class="absolute inset-0 z-50 w-full h-full p-0 m-0 outline-hidden opacity-0 cursor-pointer"
          accept=".ass,.srt"
          onchange={onFileInputChange}
        />

        <div class="flex flex-col items-center px-4">
          <div
            class="transform transition-transform duration-200 hover:scale-110"
          >
            {@html svgIcons.upload}
          </div>
          <p
            class="text-base font-semibold text-center transition-colors duration-200"
          >
            {t("subtitle-editor.drag-drop-subtitle")}
            <span
              class="text-primary hover:text-primary/80 transition-colors duration-200"
              >{t("subtitle-editor.browse")}</span
            >
          </p>
          <p
            class="text-sm text-base-content/60 mt-1 transition-opacity duration-200 hover:opacity-60"
          >
            {t("subtitle-editor.supported-formats")}
          </p>
          <p
            class="text-xs text-base-content/40 mt-8 transition-opacity duration-200 hover:opacity-60"
          >
            {t("subtitle-editor.max-file-size-10mb")}
          </p>
        </div>
      </label>

      {#if fileErrorMessage}
        <span class="mt-2 text-xs text-error">{fileErrorMessage}</span>
      {/if}
    </div>

    <!-- File List -->
    {#if hasFiles}
      <div class="mt-4 space-y-2 animate-in">
        <h3 class="font-medium flex items-center">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="mr-2 text-success"
          >
            <path
              d="M9,20.42L2.79,14.21L5.62,11.38L9,14.76L18.88,4.88L21.71,7.71L9,20.42Z"
            />
          </svg>
          {t("subtitle-editor.files-ready")}:
        </h3>
        <div class="space-y-2">
          <!-- Preloaded Files -->
          {#if preloadedSrtUrl && uploadedFile?.type !== "srt"}
            <div
              class="file-item flex items-center justify-between p-2 border rounded-lg bg-info/20"
            >
              <div class="flex items-center">
                <div class="shrink-0 p-2 rounded-md">
                  {@html svgIcons.document}
                </div>
                <div class="ml-4">
                  <p class="font-medium">
                    {t("subtitle-editor.transcription-result-srt")}
                  </p>
                  <p class="text-sm text-base-content/60">
                    {t("subtitle-editor.from-transcription")} • SRT
                  </p>
                </div>
              </div>
              <div class="badge badge-info badge-sm">
                {t("subtitle-editor.preloaded")}
              </div>
            </div>
          {/if}

          {#if preloadedAssUrl && uploadedFile?.type !== "ass"}
            <div
              class="file-item flex items-center justify-between p-2 border rounded-lg bg-info/20"
            >
              <div class="flex items-center">
                <div class="shrink-0 p-2 rounded-md">
                  {@html svgIcons.document}
                </div>
                <div class="ml-4">
                  <p class="font-medium">
                    {t("subtitle-editor.transcription-result-ass")}
                  </p>
                  <p class="text-sm text-base-content/60">
                    {t("subtitle-editor.from-transcription")} • ASS
                  </p>
                </div>
              </div>
              <div class="badge badge-info badge-sm">
                {t("subtitle-editor.preloaded")}
              </div>
            </div>
          {/if}

          <!-- Audio File Loading -->
          {#if isLoadingAudio}
            <div
              class="file-item flex items-center justify-between p-2 border rounded-lg bg-info/20"
            >
              <div class="flex items-center">
                <div class="shrink-0 p-2 rounded-md">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M12,3V9.28C11.47,9.1 10.87,9 10.25,9A4.25,4.25 0 0,0 6,13.25A4.25,4.25 0 0,0 10.25,17.5C12.84,17.5 15,15.34 15,12.75V7H18V3H12Z"
                    />
                  </svg>
                </div>
                <div class="ml-4">
                  <p class="font-medium">Loading audio file...</p>
                  <p class="text-sm text-base-content/60">
                    {t("subtitle-editor.audio-for-sync")}
                  </p>
                </div>
              </div>
              <span class="loading loading-spinner loading-md"></span>
            </div>
          {/if}

          <!-- Audio File -->
          {#if preloadedAudioFile}
            <div
              class="file-item flex items-center justify-between p-2 border rounded-lg bg-success/20"
            >
              <div class="flex items-center">
                <div class="shrink-0 p-2 rounded-md">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M12,3V9.28C11.47,9.1 10.87,9 10.25,9A4.25,4.25 0 0,0 6,13.25A4.25,4.25 0 0,0 10.25,17.5C12.84,17.5 15,15.34 15,12.75V7H18V3H12Z"
                    />
                  </svg>
                </div>
                <div class="ml-4">
                  <p class="font-medium">{preloadedAudioFile.name}</p>
                  <p class="text-sm text-base-content/60">
                    {t("subtitle-editor.audio-for-sync")}
                  </p>
                </div>
              </div>
              <div class="badge badge-success badge-sm">
                {t("subtitle-editor.audio-loaded")}
              </div>
            </div>
          {/if}

          <!-- Auto-saved Files -->
          {#if preloadedAssUrl && preloadedSrtUrl && !uploadedFile}
            <div
              class="file-item flex items-center justify-between p-2 border rounded-lg bg-warning/20"
            >
              <div class="flex items-center">
                <div class="shrink-0 p-2 rounded-md">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,6V8H13V6H11M11,10V18H13V10H11Z"
                    />
                  </svg>
                </div>
                <div class="ml-4">
                  <p class="font-medium">
                    {t("subtitle-editor.auto-saved-data")}
                  </p>
                  <p class="text-sm text-base-content/60">
                    {t("subtitle-editor.recovered-from-local-storage")}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="badge badge-warning badge-sm">
                  {t("subtitle-editor.auto-saved")}
                </div>
                <button
                  class="btn btn-ghost btn-sm hover:bg-error/20 hover:text-error transition-all duration-200"
                  onclick={clearAutoSavedData}
                  aria-label="Clear auto-saved data"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Continue Button -->
    {#if hasFiles}
      <div class="mt-6 flex justify-end">
        <!-- button disable if !isLoadingAudio -->
        <button class={`${!isLoadingAudio ? 'btn btn-primary continue-btn pulse' : 'btn btn-disabled'}`} onclick={openEditor}>
          {t("subtitle-editor.open-subtitle-editor")}
        </button>
      </div>
    {/if}
  </div>
{:else}
  <!-- Editor Section -->
  <div
    class="editor-container mt-6"
    class:fade-in={showEditor && !isTransitioning}
    class:fade-out={isTransitioning && !showEditor}
  >
    <SubtitleEditor
      {srtFileUrl}
      {assFileUrl}
      audioFile={preloadedAudioFile}
      onSave={handleSubtitleSave}
      onClose={closeEditor}
    />
  </div>
{/if}

<style>
  /* Smooth transitions for upload section */
  .upload-container {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: top center;
  }

  .upload-container.fade-out {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
    pointer-events: none;
  }

  /* Smooth transitions for editor section */
  .editor-container {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: top center;
  }

  .editor-container.fade-in {
    animation: slideInFromBottom 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .editor-container.fade-out {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }

  /* Continue button pulse effect */
  .continue-btn {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .continue-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .continue-btn.pulse {
    animation: gentlePulse 2s infinite;
  }

  /* Keyframe animations */
  @keyframes slideInFromBottom {
    0% {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    50% {
      opacity: 0.7;
      transform: translateY(-5px) scale(1.02);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes gentlePulse {
    0%,
    100% {
      transform: scale(1);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(74, 30, 255, 0.25);
    }
  }

  /* File item animations */
  .file-item {
    animation: slideInFile 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    opacity: 0;
    transform: translateX(-20px);
  }

  .file-item:nth-child(1) {
    animation-delay: 0.1s;
  }
  .file-item:nth-child(2) {
    animation-delay: 0.2s;
  }
  .file-item:nth-child(3) {
    animation-delay: 0.3s;
  }

  @keyframes slideInFile {
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* Animate file list section */
  .animate-in {
    animation: slideInSection 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  @keyframes slideInSection {
    0% {
      opacity: 0;
      transform: translateY(10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Loading state for transition */
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border-radius: 12px;
    backdrop-filter: blur(4px);
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(74, 30, 255, 0.2);
    border-top: 3px solid #491eff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
