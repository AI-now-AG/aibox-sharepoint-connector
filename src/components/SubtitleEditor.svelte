<!-- SubtitleEditor.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { slide, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import type { DialogueEntry } from "$utils/subtitleParser";
  import {
    parseASSContent,
    parseSRTContent,
    generateASSContent,
    generateSRTContent,
    timeToSeconds,
    secondsToTime,
  } from "$utils/subtitleParser";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";

  const t = useTranslations();

  interface Props {
    srtFileUrl?: string;
    assFileUrl?: string;
    audioFile?: File;
    onSave?: (
      content:
        | string
        | {
            assContent: string;
            srtContent: string;
            isBothFormats: boolean;
          },
    ) => void;
    onClose?: () => void;
  }

  let { srtFileUrl, assFileUrl, audioFile, onSave, onClose }: Props = $props();

  // State variables
  let dialogues = $state<DialogueEntry[]>([]);
  let mediaPlayer = $state<HTMLAudioElement | HTMLVideoElement>();
  let currentTime = $state(0);
  let duration = $state(0);
  let isPlaying = $state(false);
  let playbackRate = $state(1.0);
  let currentRowIndices = $state<number[]>([]);
  let currentRowIndex = $state<number | null>(null);
  let searchText = $state("");
  let replaceText = $state("");
  let statusText = $state("");
  let errorMessage = $state("");

  // Reactivity trigger for character count updates
  let updateTrigger = $state(0);

  // Video player state
  let isVideoMinimized = $state(false);
  let useSideBySideLayout = $state(false);

  // Media source
  let mediaSrc = $state<string>("");
  let mediaType = $state<"audio" | "video">("audio");
  let mediaFileName = $state<string>("");
  let hasMedia = $derived(!!mediaSrc);

  // File input for manual media upload
  let mediaFileInput = $state<HTMLInputElement>();
  let isDragOver = $state(false);

  // Subtitle overlay state
  let showSubtitleOverlay = $state(true);
  let subtitleFontSize = $state(16);
  let subtitlePosition = $state<"bottom" | "top" | "center">("bottom");
  let subtitleBackgroundOpacity = $state(0.6);
  let subtitleTextColor = $state("#FFFFFF");
  let subtitleOutlineColor = $state("#000000");

  // Delete confirmation modal state
  let deleteConfirmModal = $state<HTMLDialogElement>();
  let deleteIndex = $state<number | null>(null);

  // Auto-save state
  let autoSaveEnabled = $state(true);
  let autoSaveTimeout = $state<number | null>(null);
  let lastSavedTimestamp = $state<number | null>(null);

  // Drag and drop handlers for media upload
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
    if (files && files.length > 0) {
      handleMediaFileUpload({ target: { files } } as any);
    }
  }

  // Playback rates
  const playbackRates = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  // Keyboard shortcuts
  const keyboardShortcuts = {
    playPause: "Space",
    nextSubtitle: "ArrowDown",
    previousSubtitle: "ArrowUp",
    seekBackward: "ArrowLeft",
    seekForward: "ArrowRight",
    increaseSpeed: "Equal",
    decreaseSpeed: "Minus",
  };

  let keyboardHandler: (event: KeyboardEvent) => void;

  onMount(async () => {
    await loadSubtitleData();
    loadAutoSavedData();
    setupMediaSource();
    setupKeyboardHandlers();
  });

  onDestroy(() => {
    if (keyboardHandler) {
      window.removeEventListener("keydown", keyboardHandler);
    }
    if (mediaSrc && mediaSrc.startsWith("blob:")) {
      URL.revokeObjectURL(mediaSrc);
    }
  });

  async function loadSubtitleData() {
    try {
      if (assFileUrl) {
        const response = await fetch(assFileUrl);
        const content = await response.text();
        dialogues = parseASSContent(content);
        // normalizeTimestamps();
        // No status message needed - ready state is self-evident
      } else if (srtFileUrl) {
        const response = await fetch(srtFileUrl);
        const content = await response.text();
        dialogues = parseSRTContent(content);
        // normalizeTimestamps();
        // No status message needed - ready state is self-evident
      }
    } catch (error) {
      errorMessage = `Error loading subtitle file: ${error instanceof Error ? error.message : String(error)}`;
      console.error("Error loading subtitle data:", error);
    }
  }

  /**
   * Normalize timestamps by removing apparent timezone offset
   * Dynamically detects and removes any consistent time offset from all subtitles
   */
  function normalizeTimestamps() {
    if (dialogues.length === 0) return;

    // Find the earliest timestamp to use as potential offset
    let minStartTime = Infinity;
    dialogues.forEach((dialogue) => {
      const startTime = timeToSeconds(dialogue.start);
      minStartTime = Math.min(minStartTime, startTime);
    });

    // Only normalize if the earliest subtitle starts suspiciously late (more than 1 hour)
    // This suggests a timezone or date offset rather than legitimate late start time
    if (minStartTime > 3600) {
      // 1 hour threshold
      // Use the earliest timestamp as the offset to remove
      const offsetSeconds = minStartTime;

      // Subtract the detected offset from all timestamps
      dialogues.forEach((dialogue) => {
        const startSeconds = timeToSeconds(dialogue.start) - offsetSeconds;
        const endSeconds = timeToSeconds(dialogue.end) - offsetSeconds;

        dialogue.start = secondsToTime(Math.max(0, startSeconds));
        dialogue.end = secondsToTime(Math.max(0, endSeconds));
      });

      const offsetHours = Math.floor(offsetSeconds / 3600);
      const offsetMinutes = Math.floor((offsetSeconds % 3600) / 60);
      const offsetDisplay =
        offsetMinutes > 0
          ? `${offsetHours}h ${offsetMinutes}m`
          : `${offsetHours}h`;

      statusText += ` (Time offset of ${offsetDisplay} detected and removed)`;
    }
  }

  function setupMediaSource() {
    if (audioFile) {
      mediaSrc = URL.createObjectURL(audioFile);
      mediaFileName = audioFile.name;
      const fileName = audioFile.name.toLowerCase();
      mediaType =
        fileName.includes(".mp4") ||
        fileName.includes(".webm") ||
        fileName.includes(".mov") ||
        fileName.includes(".avi")
          ? "video"
          : "audio";
    }
  }

  function handleMediaFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      // Validate file type
      const fileName = file.name.toLowerCase();
      const isValidAudio =
        fileName.includes(".mp3") ||
        fileName.includes(".wav") ||
        fileName.includes(".ogg") ||
        fileName.includes(".m4a") ||
        fileName.includes(".flac") ||
        fileName.includes(".aac");
      const isValidVideo =
        fileName.includes(".mp4") ||
        fileName.includes(".webm") ||
        fileName.includes(".mov") ||
        fileName.includes(".avi") ||
        fileName.includes(".mkv") ||
        fileName.includes(".wmv");

      if (!isValidAudio && !isValidVideo) {
        statusText = t("subtitle-editor.valid-file-required");
        setTimeout(() => (statusText = ""), 3000);
        return;
      }

      // Clean up existing media source
      if (mediaSrc && mediaSrc.startsWith("blob:")) {
        URL.revokeObjectURL(mediaSrc);
      }

      // Create new media source
      mediaSrc = URL.createObjectURL(file);
      mediaFileName = file.name;

      // Detect media type based on file extension
      if (isValidVideo) {
        mediaType = "video";
      } else {
        mediaType = "audio";
      }

      statusText = t("subtitle-editor.media-loaded-success", {
        filename: file.name,
      });
      setTimeout(() => (statusText = ""), 3000);
    }
  }

  function setupKeyboardHandlers() {
    keyboardHandler = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      switch (event.code) {
        case "Space":
          event.preventDefault();
          togglePlayPause();
          break;
        case "ArrowDown":
          event.preventDefault();
          nextSubtitle();
          break;
        case "ArrowUp":
          event.preventDefault();
          previousSubtitle();
          break;
        case "ArrowLeft":
          event.preventDefault();
          seekMedia(-5);
          break;
        case "ArrowRight":
          event.preventDefault();
          seekMedia(5);
          break;
        case "Equal":
          event.preventDefault();
          changePlaybackRate(0.25);
          break;
        case "Minus":
          event.preventDefault();
          changePlaybackRate(-0.25);
          break;
      }
    };

    window.addEventListener("keydown", keyboardHandler);
  }

  function handleTimeUpdate() {
    if (!mediaPlayer) return;

    currentTime = mediaPlayer.currentTime;
    duration = mediaPlayer.duration || 0;
    updateCurrentRows();
  }

  function updateCurrentRows() {
    const previousRowIndex = currentRowIndex;
    currentRowIndices = [];

    dialogues.forEach((dialogue, index) => {
      const start = timeToSeconds(dialogue.start);
      const end = timeToSeconds(dialogue.end);

      if (currentTime >= start && currentTime <= end) {
        currentRowIndices.push(index);
      }
    });

    if (currentRowIndices.length > 0) {
      // If the previously selected row is still active, keep it selected
      // Otherwise, select the first active row
      if (
        previousRowIndex !== null &&
        currentRowIndices.includes(previousRowIndex)
      ) {
        currentRowIndex = previousRowIndex;
      } else {
        currentRowIndex = currentRowIndices[0];
      }
      scrollToCurrentRow();
    } else {
      currentRowIndex = null;
    }
  }

  function scrollToCurrentRow() {
    if (currentRowIndex === null) return;

    const row = document.querySelector(
      `[data-row-index="${currentRowIndex}"]`,
    ) as HTMLElement;
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function getCurrentSubtitleText(): string {
    if (!showSubtitleOverlay || currentRowIndices.length === 0) return "";

    // Get all currently active subtitles
    const activeSubtitles = currentRowIndices
      .map((index) => dialogues[index])
      .filter((dialogue) => dialogue && dialogue.text.trim());

    if (activeSubtitles.length === 0) return "";

    // Join multiple active subtitles with line breaks
    return activeSubtitles
      .map((dialogue) => {
        // Convert ASS/SRT line breaks to HTML line breaks
        return dialogue.text.replace(/\\N/g, "\n").replace(/\\n/g, "\n").trim();
      })
      .join("\n");
  }

  function togglePlayPause() {
    if (!mediaPlayer) return;

    if (mediaPlayer.paused) {
      mediaPlayer.play();
      isPlaying = true;
    } else {
      mediaPlayer.pause();
      isPlaying = false;
    }
  }

  function seekMedia(seconds: number) {
    if (!mediaPlayer) return;
    mediaPlayer.currentTime = Math.max(
      0,
      Math.min(duration, currentTime + seconds),
    );
  }

  function changePlaybackRate(delta: number) {
    const newRate = Math.max(0.25, Math.min(2.0, playbackRate + delta));
    playbackRate = newRate;
    if (mediaPlayer) {
      mediaPlayer.playbackRate = playbackRate;
    }
  }

  function jumpToTime(timeStr: string) {
    if (!mediaPlayer) return;
    const seconds = timeToSeconds(timeStr);
    mediaPlayer.currentTime = seconds;
  }

  function highlightRow(index: number) {
    currentRowIndex = index;
    currentRowIndices = [index];
    const dialogue = dialogues[index];
    if (dialogue) {
      jumpToTime(dialogue.start);
    }
    scrollToCurrentRow();
  }

  function nextSubtitle() {
    if (dialogues.length === 0) return;

    let nextIndex = 0;
    if (currentRowIndex !== null) {
      nextIndex = (currentRowIndex + 1) % dialogues.length;
    }

    highlightRow(nextIndex);
  }

  function previousSubtitle() {
    if (dialogues.length === 0) return;

    let prevIndex = 0;
    if (currentRowIndex !== null) {
      prevIndex =
        currentRowIndex > 0 ? currentRowIndex - 1 : dialogues.length - 1;
    }

    highlightRow(prevIndex);
  }

  function searchAndReplace() {
    if (!searchText.trim()) {
      statusText = t("subtitle-editor.enter-search-text");
      setTimeout(() => (statusText = ""), 3000);
      return;
    }

    let count = 0;
    dialogues.forEach((dialogue) => {
      if (dialogue.text.includes(searchText)) {
        dialogue.text = dialogue.text.replaceAll(searchText, replaceText);
        count++;
      }
    });

    statusText = t("subtitle-editor.occurrences-replaced", { count });
    setTimeout(() => (statusText = ""), 3000);
    searchText = "";
    replaceText = "";
    dialogues = [...dialogues];
    triggerAutoSave();
  }

  function deleteRow(index: number) {
    deleteIndex = index;
    deleteConfirmModal?.showModal();
  }

  function confirmDelete() {
    if (deleteIndex !== null) {
      dialogues.splice(deleteIndex, 1);
      dialogues = [...dialogues];
      statusText = t("subtitle-editor.subtitle-deleted", {
        index: deleteIndex + 1,
      });
      setTimeout(() => (statusText = ""), 3000);
      deleteIndex = null;
    }
    deleteConfirmModal?.close();
    triggerAutoSave();
  }

  function addRowAfter(index: number) {
    const currentDialogue = dialogues[index];
    const newDialogue: DialogueEntry = {
      start: currentDialogue.start,
      end: currentDialogue.end,
      text: "",
      style: currentDialogue.style || "Default",
    };

    dialogues.splice(index + 1, 0, newDialogue);
    dialogues = [...dialogues];
    statusText = t("subtitle-editor.subtitle-added", { index: index + 1 });
    setTimeout(() => (statusText = ""), 3000);
    triggerAutoSave();
  }

  // Auto-save functionality
  function triggerAutoSave() {
    if (!autoSaveEnabled || dialogues.length === 0) return;

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new timeout for auto-save (1 second delay)
    autoSaveTimeout = setTimeout(() => {
      try {
        const data = {
          dialogues: dialogues,
          timestamp: new Date().toISOString(),
          mediaFileName: mediaFileName,
          assFileUrl: assFileUrl,
          srtFileUrl: srtFileUrl,
        };

        localStorage.setItem('subtitle-editor-autosave', JSON.stringify(data));
        lastSavedTimestamp = Date.now();
        autoSaveTimeout = null;
      } catch (error) {
        console.error("Auto-save error:", error);
      }
    }, 1000);
  }

  // Load auto-saved data on component mount
  function loadAutoSavedData() {
    try {
      const stored = localStorage.getItem('subtitle-editor-autosave');
      if (stored) {
        const data = JSON.parse(stored);
        dialogues = data.dialogues || [];
        mediaFileName = data.mediaFileName || "";
        assFileUrl = data.assFileUrl || "";
        srtFileUrl = data.srtFileUrl || "";
        statusText = t("subtitle-editor.auto-saved-data-loaded");
        setTimeout(() => (statusText = ""), 3000);
      }
    } catch (error) {
      console.error("Error loading auto-saved data:", error);
    }
  }

  async function exportSubtitles() {
    if (!onSave) return;

    if (assFileUrl && srtFileUrl) {
      // Both formats available - create combined export
      await exportBothFormats();
    } else if (assFileUrl) {
      // Only ASS format available
      const assContent = generateASSContent(dialogues);
      onSave(assContent);
      statusText = t("subtitle-editor.exported-ass");
      setTimeout(() => (statusText = ""), 3000);
    } else if (srtFileUrl) {
      // Only SRT format available - export as SRT
      const srtContent = generateSRTContent(dialogues);
      onSave(srtContent);
      statusText = t("subtitle-editor.exported-srt");
      setTimeout(() => (statusText = ""), 3000);
    } else {
      // Default to ASS format
      const assContent = generateASSContent(dialogues);
      onSave(assContent);
      statusText = t("subtitle-editor.exported-default");
      setTimeout(() => (statusText = ""), 3000);
    }
  }

  async function exportBothFormats() {
    try {
      // Generate both formats regardless of source format
      const assContent = generateASSContent(dialogues);
      const srtContent = generateSRTContent(dialogues);

      // Call onSave with both contents for the parent to handle downloading
      if (onSave) {
        const bothFormats = {
          assContent,
          srtContent,
          isBothFormats: true,
        };
        onSave(bothFormats);
      }

      statusText = t("subtitle-editor.exported-both");
      setTimeout(() => (statusText = ""), 3000);
    } catch (error) {
      console.error("Error creating both formats:", error);
      statusText = t("subtitle-editor.export-error");
      setTimeout(() => (statusText = ""), 5000);
    }
  }

  function exportAsASS() {
    const assContent = generateASSContent(dialogues);
    if (onSave) {
      onSave(assContent);
    }
    statusText = t("subtitle-editor.exported-ass");
    setTimeout(() => (statusText = ""), 3000);
  }

  function exportAsSRT() {
    const srtContent = generateSRTContent(dialogues);
    if (onSave) {
      onSave(srtContent);
    }
    statusText = t("subtitle-editor.exported-srt");
    setTimeout(() => (statusText = ""), 3000);
  }

  function getCharCountClass(dialogue: DialogueEntry, trigger: number = 0) {
    // The trigger parameter ensures this function is called when updateTrigger changes
    const start = timeToSeconds(dialogue.start);
    const end = timeToSeconds(dialogue.end);
    const duration = end - start;
    const charCount = dialogue.text.length;

    if (charCount === 0) return "";

    const durationPerChar = duration / charCount;
    let classes = "font-bold";

    // Color logic matching the original HTML implementation
    if (durationPerChar <= 0.05) {
      classes += " text-error"; // Red - too fast
    } else if (durationPerChar >= 0.1) {
      classes += " text-info"; // Blue - too slow
    } else if (durationPerChar > 0.05 && durationPerChar < 0.075) {
      // Interpolate between red and green (orange-ish)
      classes += " text-warning"; // Orange/yellow - getting better
    } else if (durationPerChar >= 0.075 && durationPerChar < 0.1) {
      // Interpolate between green and blue (green-ish)
      classes += " text-success"; // Green - good timing
    } else {
      classes += " text-success"; // Green - good timing (fallback)
    }

    // Check for lines exceeding 36 characters and add red horizontal line indicator
    const textLines = dialogue.text.split(/\\N|\\n|\r\n|\r|\n/);
    const hasLongLine = textLines.some((line) => line.length > 36);
    if (hasLongLine) {
      classes += " border-l-4 border-error pl-2";
    }

    return classes;
  }
</script>

<div
  class="bg-base-100 text-base-content p-4 min-h-[80vh] max-h-[90vh] flex flex-col font-sans"
>
  {#if statusText || errorMessage}
    <div
      class="alert {errorMessage ? 'alert-error' : 'alert-info'} mb-4"
      transition:slide={{ duration: 400, easing: cubicOut }}
    >
      <div>
        {#if statusText}
          <span class="text-sm" in:fade={{ duration: 300, delay: 200 }}
            >{statusText}</span
          >
        {/if}
        {#if errorMessage}
          <p
            class="text-error text-xs mt-1"
            in:fade={{ duration: 300, delay: 200 }}
          >
            {errorMessage}
          </p>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Controls Section -->
  <div class="controls-section bg-base-200 p-4 rounded-lg mb-4">
    <!-- Search and Replace with Close Button -->
    <div class="search-replace flex items-center gap-4">
      <div class="flex items-center gap-2">
        <label for="search">{t("subtitle-editor.search")}:</label>
        <input
          id="search"
          type="text"
          bind:value={searchText}
          placeholder={t("subtitle-editor.search-placeholder")}
          class="input input-sm input-bordered"
        />
      </div>
      <div class="flex items-center gap-2">
        <label for="replace">{t("subtitle-editor.replace")}:</label>
        <input
          id="replace"
          type="text"
          bind:value={replaceText}
          placeholder={t("subtitle-editor.replace-placeholder")}
          class="input input-sm input-bordered"
        />
      </div>
      <button onclick={searchAndReplace} class="btn btn-primary btn-sm"
        >{t("subtitle-editor.replace-button")}</button
      >

      <!-- Export Dropdown -->
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-success btn-sm">
          {@html svgIcons.fileExport} Export
        </div>
        <ul
          class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-64"
        >
          <!-- Both formats option -->
          <li>
            <button onclick={exportBothFormats} class="flex items-center gap-2">
              {@html svgIcons.fileExport}
              <span>{t("subtitle-editor.export-both-formats")}</span>
            </button>
          </li>

          {#if assFileUrl}
            <!-- ASS format available - show individual ASS export -->
            <li>
              <button onclick={exportAsASS} class="flex items-center gap-2">
                {@html svgIcons.fileExport}
                <span>{t("subtitle-editor.ass-only")}</span>
              </button>
            </li>
          {:else if srtFileUrl}
            <!-- SRT format available - show individual SRT export -->
            <li>
              <button onclick={exportAsSRT} class="flex items-center gap-2">
                {@html svgIcons.fileExport}
                <span>{t("subtitle-editor.srt-only")}</span>
              </button>
            </li>
          {:else}
            <!-- No source format - show both individual options -->
            <li>
              <button onclick={exportAsASS} class="flex items-center gap-2">
                {@html svgIcons.fileExport}
                <span>{t("subtitle-editor.ass-only")}</span>
              </button>
            </li>
            <li>
              <button onclick={exportAsSRT} class="flex items-center gap-2">
                {@html svgIcons.fileExport}
                <span>{t("subtitle-editor.srt-only")}</span>
              </button>
            </li>
          {/if}
        </ul>
      </div>

      <!-- Layout Controls and Close Button -->
      <div class="flex items-center gap-2 ml-auto">
        {#if onClose}
          <button
            class="btn btn-sm btn-circle btn-ghost"
            onclick={onClose}
            aria-label="Close subtitle editor"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Main Content Area with Layout Switching -->
  <div
    class="flex-1 flex {useSideBySideLayout
      ? 'flex-row gap-4'
      : 'flex-col'} min-h-0"
  >
    <!-- Subtitle Table -->
    <div
      class="flex-1 bg-base-200 rounded-lg p-4 overflow-auto {useSideBySideLayout
        ? 'min-w-96'
        : ''} {isVideoMinimized ? 'min-h-96' : 'min-h-64'}"
    >
      {#if dialogues.length > 0}
        <div class="overflow-x-auto">
          <table class="table table-xs w-full min-w-[800px]">
            <thead>
              <tr class="bg-base-300">
                {#if hasMedia}
                  <th class="w-16 min-w-16"></th>
                {/if}
                <th class="w-32 min-w-32">{t("subtitle-editor.start")}</th>
                <th class="min-w-80 flex-1">{t("subtitle-editor.text")}</th>
                <th class="w-32 min-w-32">{t("subtitle-editor.end")}</th>
                <th class="w-24 min-w-24 text-center"
                  >{t("subtitle-editor.chars")}</th
                >
                <th class="w-28 min-w-28 text-center"
                  >{t("subtitle-editor.actions")}</th
                >
              </tr>
            </thead>
            <tbody>
              {#each dialogues as dialogue, index}
                <tr
                  data-row-index={index}
                  class="hover:bg-base-200 cursor-pointer transition-colors duration-200 {currentRowIndex ===
                  index
                    ? 'bg-accent text-accent-content shadow-lg border-l-4 border-accent-focus'
                    : ''}"
                  onclick={() => highlightRow(index)}
                >
                  {#if hasMedia}
                    <td class="p-1">
                      <button
                        onclick={(e) => {
                          e.stopPropagation();
                          highlightRow(index);
                          togglePlayPause();
                        }}
                        class="btn btn-xs btn-circle {isPlaying &&
                        currentRowIndex === index
                          ? 'btn-success text-success-content'
                          : 'btn-ghost hover:btn-primary'}"
                      >
                        {isPlaying && currentRowIndex === index ? "⏸️" : "▶️"}
                      </button>
                    </td>
                  {/if}
                  <td class="p-1">
                    <input
                      type="text"
                      bind:value={dialogue.start}
                      onclick={(e) => e.stopPropagation()}
                      oninput={triggerAutoSave}
                      class="input w-full min-w-30 {currentRowIndex === index
                        ? 'input-bordered bg-base-100 text-base-content'
                        : ''}"
                      placeholder="0:00:00"
                    />
                  </td>
                  <td class="p-1 min-w-80 flex-1">
                    <textarea
                      bind:value={dialogue.text}
                      onclick={(e) => e.stopPropagation()}
                      oninput={() => {
                        // Trigger reactivity for character count updates
                        updateTrigger++;
                        triggerAutoSave();
                      }}
                      class="textarea w-full resize-none leading-tight py-1 px-2 min-h-0 {currentRowIndex ===
                      index
                        ? 'textarea-bordered bg-base-100 text-base-content'
                        : ''}"
                      rows="2"
                      placeholder={t(
                        "subtitle-editor.subtitle-text-placeholder",
                      )}
                    ></textarea>
                  </td>
                  <td class="p-1">
                    <input
                      type="text"
                      bind:value={dialogue.end}
                      onclick={(e) => e.stopPropagation()}
                      oninput={triggerAutoSave}
                      class="input w-full min-w-30 {currentRowIndex === index
                        ? 'input-bordered bg-base-100 text-base-content'
                        : ''}"
                      placeholder="0:00:00"
                    />
                  </td>
                  <td class="p-1 text-center">
                    <div
                      class="text-sm font-mono {currentRowIndex === index
                        ? 'font-bold text-accent-content'
                        : getCharCountClass(dialogue, updateTrigger)}"
                    >
                      {#if dialogue.text.split(/\\N|\\n|\r\n|\r|\n/).length > 1}
                        {@html dialogue.text
                          .split(/\\N|\\n|\r\n|\r|\n/)
                          .map((line) => line.length)
                          .join("<br>")}
                      {:else}
                        {dialogue.text.length}
                      {/if}
                    </div>
                  </td>
                  <td class="p-1">
                    <div class="join">
                      <button
                        onclick={(e) => {
                          e.stopPropagation();
                          deleteRow(index);
                        }}
                        class="btn btn-xs btn-outline btn-error join-item"
                        title={t("subtitle-editor.delete-title")}
                      >
                        {@html svgIcons.trash}
                      </button>
                      <button
                        onclick={(e) => {
                          e.stopPropagation();
                          addRowAfter(index);
                        }}
                        class="btn btn-xs btn-outline btn-success join-item"
                        title={t("subtitle-editor.add-after-title")}
                      >
                        {@html svgIcons.add}
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="text-center text-base-content opacity-60 py-8">
          {t("subtitle-editor.no-subtitles-loaded")}
        </div>
      {/if}
    </div>

    <!-- Media Player Section -->
    <div
      class="media-section bg-base-200 rounded-lg {useSideBySideLayout
        ? 'w-[480px] flex-shrink-0 p-4'
        : isVideoMinimized
          ? 'mt-4 flex-shrink-0 h-auto p-2'
          : 'mt-4 flex-shrink-0 p-4'}"
    >
      {#if hasMedia}
        <!-- Media Status Header -->
        <div class="flex flex-col gap-2">
          <!-- Top Row: Controls -->
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {t("subtitle-editor.media-player")}
            </h3>
            <div class="flex items-center gap-2">
              {#if mediaType === "video" && dialogues.length > 0}
                <!-- Subtitle Overlay Controls -->
                <div class="dropdown dropdown-end">
                  <div tabindex="0" role="button" class="btn btn-xs btn-ghost">
                    📄 {t("subtitle-editor.subtitle-overlay-menu")}
                  </div>
                  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                  <ul
                    tabindex="0"
                    class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-64"
                  >
                    <li>
                      <label
                        class="cursor-pointer flex items-center gap-2 py-2 px-2 hover:bg-base-200 rounded"
                      >
                        <input
                          type="checkbox"
                          bind:checked={showSubtitleOverlay}
                          class="checkbox checkbox-sm"
                        />
                        <span class="flex-1"
                          >{t("subtitle-editor.show-subtitles-on-video")}</span
                        >
                      </label>
                    </li>
                    {#if showSubtitleOverlay}
                      <li class="menu-title">
                        <span>{t("subtitle-editor.subtitle-position")}</span>
                      </li>
                      <li>
                        <label
                          class="cursor-pointer flex items-center gap-2 py-2 px-2 hover:bg-base-200 rounded"
                        >
                          <input
                            type="radio"
                            bind:group={subtitlePosition}
                            value="bottom"
                            name="subtitle-position"
                            class="radio radio-sm"
                          />
                          <span class="flex-1"
                            >{t("subtitle-editor.position-bottom")}</span
                          >
                        </label>
                      </li>
                      <li>
                        <label
                          class="cursor-pointer flex items-center gap-2 py-2 px-2 hover:bg-base-200 rounded"
                        >
                          <input
                            type="radio"
                            bind:group={subtitlePosition}
                            value="center"
                            name="subtitle-position"
                            class="radio radio-sm"
                          />
                          <span class="flex-1"
                            >{t("subtitle-editor.position-center")}</span
                          >
                        </label>
                      </li>
                      <li>
                        <label
                          class="cursor-pointer flex items-center gap-2 py-2 px-2 hover:bg-base-200 rounded"
                        >
                          <input
                            type="radio"
                            bind:group={subtitlePosition}
                            value="top"
                            name="subtitle-position"
                            class="radio radio-sm"
                          />
                          <span class="flex-1"
                            >{t("subtitle-editor.position-top")}</span
                          >
                        </label>
                      </li>
                      <!-- <li class="menu-title">
                        <span>{t("subtitle-editor.subtitle-appearance")}</span>
                      </li>
                      <li>
                        <label class="cursor-pointer">
                          <div class="flex items-center justify-between">
                            <span>{t("subtitle-editor.font-size")}</span>
                            <span class="text-xs">{subtitleFontSize}px</span>
                          </div>
                          <input 
                            type="range" 
                            bind:value={subtitleFontSize}
                            min="12" 
                            max="48" 
                            step="2"
                            class="range range-xs"
                          />
                        </label>
                      </li>
                      <li>
                        <label class="cursor-pointer">
                          <div class="flex items-center justify-between">
                            <span>{t("subtitle-editor.background-opacity")}</span>
                            <span class="text-xs">{Math.round(subtitleBackgroundOpacity * 100)}%</span>
                          </div>
                          <input 
                            type="range" 
                            bind:value={subtitleBackgroundOpacity}
                            min="0" 
                            max="1" 
                            step="0.1"
                            class="range range-xs"
                          />
                        </label>
                      </li> -->
                    {/if}
                  </ul>
                </div>
              {:else if mediaFileName}
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <!-- <div class="badge badge-info badge-sm">
                    🎵 {mediaType.toUpperCase()}
                  </div> -->
                    <div
                      class="text-sm text-base-content/80 max-w-64 truncate"
                      title={mediaFileName}
                    >
                      {mediaFileName}
                    </div>
                  </div>
                  <button
                    onclick={() => {
                      if (mediaSrc && mediaSrc.startsWith("blob:")) {
                        URL.revokeObjectURL(mediaSrc);
                      }
                      mediaSrc = "";
                      mediaFileName = "";
                      if (mediaFileInput) mediaFileInput.value = "";
                      statusText = t("subtitle-editor.media-removed");
                      setTimeout(() => (statusText = ""), 3000);
                    }}
                    class="btn btn-xs btn-ghost text-error hover:bg-error/20"
                    title={t("subtitle-editor.remove-media")}
                  >
                    ✕
                  </button>
                </div>
              {/if}

              {#if mediaType === "video"}
                <!-- Layout Switch Controls -->
                <div class="dropdown dropdown-end">
                  <div tabindex="0" role="button" class="btn btn-xs btn-ghost">
                    {t("subtitle-editor.switch-layout")} ⚙️
                  </div>
                  <ul
                    class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                  >
                    <li>
                      <button
                        onclick={() => {
                          useSideBySideLayout = false;
                          isVideoMinimized = false;
                        }}>{t("subtitle-editor.standard-video-top")}</button
                      >
                    </li>
                    <li>
                      <button
                        onclick={() => {
                          useSideBySideLayout = true;
                          isVideoMinimized = false;
                        }}>{t("subtitle-editor.side-by-side")}</button
                      >
                    </li>
                    <li>
                      <button
                        onclick={() => {
                          useSideBySideLayout = false;
                          isVideoMinimized = true;
                        }}>{t("subtitle-editor.minimized-video")}</button
                      >
                    </li>
                  </ul>
                </div>
                {#if mediaFileName && !useSideBySideLayout}
                  <div class="flex items-center justify-end">
                    <div class="flex items-center gap-2">
                      {#if mediaFileName}
                        <div
                          class="text-xs text-base-content/70 max-w-48 truncate"
                          title={mediaFileName}
                        >
                          {mediaFileName}
                        </div>
                      {/if}
                    </div>

                    <button
                      onclick={() => {
                        if (mediaSrc && mediaSrc.startsWith("blob:")) {
                          URL.revokeObjectURL(mediaSrc);
                        }
                        mediaSrc = "";
                        mediaFileName = "";
                        if (mediaFileInput) mediaFileInput.value = "";
                        statusText = t("subtitle-editor.media-removed");
                        setTimeout(() => (statusText = ""), 3000);
                      }}
                      class="btn btn-xs btn-ghost text-error hover:bg-error/20"
                      title={t("subtitle-editor.remove-media")}
                    >
                      ✕
                    </button>
                  </div>
                {/if}
              {/if}
            </div>
          </div>

          <!-- Bottom Row: Status & Close -->
          {#if useSideBySideLayout}
            <div class="flex items-center justify-end pb-2">
              <div class="flex items-center gap-2">
                <!-- <div class="badge badge-success badge-sm gap-1">
                <div class="w-2 h-2 bg-success-content rounded-full"></div>
                {mediaType.toUpperCase()} {t("subtitle-editor.loaded")}
              </div> -->
                {#if mediaFileName}
                  <div
                    class="text-xs text-base-content/70 max-w-48 truncate"
                    title={mediaFileName}
                  >
                    {mediaFileName}
                  </div>
                {/if}
              </div>

              <button
                onclick={() => {
                  if (mediaSrc && mediaSrc.startsWith("blob:")) {
                    URL.revokeObjectURL(mediaSrc);
                  }
                  mediaSrc = "";
                  mediaFileName = "";
                  if (mediaFileInput) mediaFileInput.value = "";
                  statusText = t("subtitle-editor.media-removed");
                  setTimeout(() => (statusText = ""), 3000);
                }}
                class="btn btn-xs btn-ghost text-error hover:bg-error/20"
                title={t("subtitle-editor.remove-media")}
              >
                ✕
              </button>
            </div>
          {/if}
        </div>

        <div
          class="flex flex-col items-center mt-2 {isVideoMinimized
            ? 'gap-2'
            : 'gap-4'}"
        >
          <!-- Media Content -->

          <!-- Media Element -->
          {#if mediaType === "video"}
            {#if !isVideoMinimized}
              <!-- Video Container with Subtitle Overlay -->
              <div class="relative inline-block max-w-full">
                <!-- svelte-ignore a11y_media_has_caption -->
                <video
                  bind:this={mediaPlayer}
                  src={mediaSrc}
                  class="w-full {useSideBySideLayout
                    ? 'max-h-80 max-w-[440px]'
                    : 'max-h-96 max-w-full'} bg-black rounded shadow-lg block"
                  controls
                  ontimeupdate={handleTimeUpdate}
                  onplay={() => (isPlaying = true)}
                  onpause={() => (isPlaying = false)}
                  onloadedmetadata={() =>
                    (duration = mediaPlayer?.duration || 0)}
                >
                </video>

                <!-- Subtitle Overlay -->
                {#if showSubtitleOverlay && getCurrentSubtitleText()}
                  <div
                    class="absolute left-0 right-0 pointer-events-none z-10 px-4 py-2 flex justify-center
                    {subtitlePosition === 'bottom'
                      ? 'bottom-4'
                      : subtitlePosition === 'top'
                        ? 'top-4'
                        : 'top-1/2 -translate-y-1/2'}"
                  >
                    <div
                      class="inline-block text-center leading-tight rounded px-3 py-2 mb-4 max-w-full break-words"
                      style="
                      font-size: {subtitleFontSize}px;
                      color: {subtitleTextColor};
                      background-color: rgba(0, 0, 0, {subtitleBackgroundOpacity});
                      text-shadow: 
                        1px 1px 0 {subtitleOutlineColor},
                        -1px 1px 0 {subtitleOutlineColor},
                        1px -1px 0 {subtitleOutlineColor},
                        -1px -1px 0 {subtitleOutlineColor},
                        2px 2px 4px rgba(0, 0, 0, 0.8);
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                      font-weight: bold;
                      word-wrap: break-word;
                      hyphens: auto;
                      max-width: calc(100% - 2rem);
                    "
                    >
                      {#each getCurrentSubtitleText().split("\n") as line}
                        <div>{line}</div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {:else}
              <!-- Minimized video - just show a small thumbnail/placeholder -->
              <div
                class="flex items-center gap-3 bg-base-300 p-3 rounded-lg w-full"
              >
                <div
                  class="w-16 h-10 bg-black rounded flex items-center justify-center"
                >
                  <svg
                    class="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fill-rule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-medium">
                    {t("subtitle-editor.video-preview-minimized")}
                  </p>
                  <p class="text-xs opacity-60">
                    {t("subtitle-editor.audio-controls-available")}
                  </p>
                  {#if mediaFileName}
                    <p
                      class="text-xs opacity-60 truncate"
                      title={mediaFileName}
                    >
                      {mediaFileName}
                    </p>
                  {/if}
                </div>
              </div>
              <!-- Hidden video element for audio playback -->
              <!-- svelte-ignore a11y_media_has_caption -->
              <video
                bind:this={mediaPlayer}
                src={mediaSrc}
                class="hidden"
                ontimeupdate={handleTimeUpdate}
                onplay={() => (isPlaying = true)}
                onpause={() => (isPlaying = false)}
                onloadedmetadata={() => (duration = mediaPlayer?.duration || 0)}
              >
              </video>
            {/if}
          {:else}
            <!-- svelte-ignore a11y_media_has_caption -->
            <audio
              bind:this={mediaPlayer}
              src={mediaSrc}
              class="w-full"
              controls
              ontimeupdate={handleTimeUpdate}
              onplay={() => (isPlaying = true)}
              onpause={() => (isPlaying = false)}
              onloadedmetadata={() => (duration = mediaPlayer?.duration || 0)}
            >
            </audio>
          {/if}

          <!-- Media Controls -->
          <div
            class="flex flex-wrap items-center justify-center gap-2 bg-base-300 p-3 rounded-lg"
          >
            <div class="join">
              <button
                onclick={() => seekMedia(-10)}
                class="btn btn-sm join-item">-10s</button
              >
              <button onclick={() => seekMedia(-5)} class="btn btn-sm join-item"
                >-5s</button
              >
              <button
                onclick={togglePlayPause}
                class="btn btn-primary btn-sm join-item"
              >
                {isPlaying ? "⏸️" : "▶️"}
              </button>
              <button onclick={() => seekMedia(5)} class="btn btn-sm join-item"
                >+5s</button
              >
              <button onclick={() => seekMedia(10)} class="btn btn-sm join-item"
                >+10s</button
              >
            </div>

            <div class="flex items-center gap-2">
              <label for="speed-select" class="text-sm"
                >{t("subtitle-editor.speed")}:</label
              >
              <select
                id="speed-select"
                bind:value={playbackRate}
                onchange={() =>
                  mediaPlayer && (mediaPlayer.playbackRate = playbackRate)}
                class="select select-sm select-bordered"
              >
                {#each playbackRates as rate}
                  <option value={rate}>{rate}x</option>
                {/each}
              </select>
            </div>
          </div>

          <!-- Time Display -->
          <div class="text-sm text-center opacity-70 font-mono">
            {Math.floor(currentTime / 60)}:{(currentTime % 60)
              .toFixed(1)
              .padStart(4, "0")} /
            {Math.floor(duration / 60)}:{(duration % 60)
              .toFixed(1)
              .padStart(4, "0")}
          </div>
        </div>
      {:else}
        <!-- Media Upload Section -->
        <h3 class="text-lg font-semibold mb-3">
          {t("subtitle-editor.media-player")}
        </h3>
        <p class="mb-3 text-sm text-base-content/70">
          {t("subtitle-editor.upload-media-description")}
        </p>

        <div class="relative flex flex-col">
          <label
            class={`py-6 relative flex flex-col text-base-content border border-dashed rounded-sm cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
              isDragOver
                ? "border-info bg-info/10 shadow-lg scale-[1.02]"
                : "border-neutral-content hover:border-primary/50 hover:bg-primary/5"
            }`}
            ondragover={onDragOver}
            ondragleave={onDragLeave}
            ondrop={onDrop}
          >
            <input
              bind:this={mediaFileInput}
              type="file"
              class="absolute inset-0 z-50 w-full h-full p-0 m-0 outline-hidden opacity-0 cursor-pointer"
              accept="audio/*,video/*,.mp3,.wav,.ogg,.m4a,.flac,.aac,.mp4,.webm,.mov,.avi,.mkv,.wmv"
              onchange={handleMediaFileUpload}
            />

            <div class="flex flex-col items-center px-4">
              <div
                class="transform transition-transform duration-200 hover:scale-110"
              >
                <svg
                  class="w-12 h-12 text-base-content/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p
                class="text-base font-semibold text-center transition-colors duration-200 mt-2"
              >
                {t("subtitle-editor.add-media-file")}
              </p>
              <p
                class="text-base text-base-content/70 text-center transition-colors duration-200 mt-1"
              >
                {t("subtitle-editor.drag-and-drop")}
                <span
                  class="text-primary hover:text-primary/80 transition-colors duration-200"
                  >{t("subtitle-editor.click-to-browse")}</span
                >
              </p>
              <div class="flex flex-wrap justify-center gap-2 mt-3">
                <span class="badge badge-outline badge-sm">MP3</span>
                <span class="badge badge-outline badge-sm">WAV</span>
                <span class="badge badge-outline badge-sm">MP4</span>
                <span class="badge badge-outline badge-sm">WebM</span>
                <span class="badge badge-outline badge-sm">MOV</span>
                <span class="badge badge-outline badge-sm">AVI</span>
              </div>
              <p
                class="text-xs text-base-content/40 mt-4 transition-opacity duration-200 hover:opacity-60"
              >
                {t("subtitle-editor.maximum-file-size")}
              </p>
            </div>
          </label>
        </div>

        <!-- Info Text -->
        <div class="mt-4 text-center">
          <p class="text-sm text-base-content/40 leading-relaxed">
            {t("subtitle-editor.media-sync-description")}
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Delete Confirmation Modal -->
<ConfirmDialog
  bind:modal={deleteConfirmModal}
  confirm={confirmDelete}
  title={t("confirmation.delete.title")}
  description={t("subtitle-editor.delete-confirm")}
/>
