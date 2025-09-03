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

  interface Props {
    srtFileUrl?: string;
    assFileUrl?: string;
    audioFile?: File;
    onSave?: (content: string | {
      assContent: string;
      srtContent: string;
      isBothFormats: boolean;
    }) => void;
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
  let hasMedia = $derived(!!mediaSrc);

  // File input for manual media upload
  let mediaFileInput = $state<HTMLInputElement>();
  let isDragOver = $state(false);

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
    dialogues.forEach(dialogue => {
      const startTime = timeToSeconds(dialogue.start);
      minStartTime = Math.min(minStartTime, startTime);
    });

    // Only normalize if the earliest subtitle starts suspiciously late (more than 1 hour)
    // This suggests a timezone or date offset rather than legitimate late start time
    if (minStartTime > 3600) { // 1 hour threshold
      // Use the earliest timestamp as the offset to remove
      const offsetSeconds = minStartTime;
      
      // Subtract the detected offset from all timestamps
      dialogues.forEach(dialogue => {
        const startSeconds = timeToSeconds(dialogue.start) - offsetSeconds;
        const endSeconds = timeToSeconds(dialogue.end) - offsetSeconds;
        
        dialogue.start = secondsToTime(Math.max(0, startSeconds));
        dialogue.end = secondsToTime(Math.max(0, endSeconds));
      });

      const offsetHours = Math.floor(offsetSeconds / 3600);
      const offsetMinutes = Math.floor((offsetSeconds % 3600) / 60);
      const offsetDisplay = offsetMinutes > 0 
        ? `${offsetHours}h ${offsetMinutes}m` 
        : `${offsetHours}h`;

      statusText += ` (Time offset of ${offsetDisplay} detected and removed)`;
    }
  }

  function setupMediaSource() {
    if (audioFile) {
      mediaSrc = URL.createObjectURL(audioFile);
      const fileName = audioFile.name.toLowerCase();
      mediaType =
        fileName.includes(".mp4") || fileName.includes(".webm") || fileName.includes(".mov") || fileName.includes(".avi")
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
      const isValidAudio = fileName.includes(".mp3") || fileName.includes(".wav") || 
                          fileName.includes(".ogg") || fileName.includes(".m4a") || 
                          fileName.includes(".flac") || fileName.includes(".aac");
      const isValidVideo = fileName.includes(".mp4") || fileName.includes(".webm") || 
                          fileName.includes(".mov") || fileName.includes(".avi") || 
                          fileName.includes(".mkv") || fileName.includes(".wmv");
      
      if (!isValidAudio && !isValidVideo) {
        statusText = "Please select a valid audio or video file";
        setTimeout(() => statusText = "", 3000);
        return;
      }
      
      // Clean up existing media source
      if (mediaSrc && mediaSrc.startsWith("blob:")) {
        URL.revokeObjectURL(mediaSrc);
      }
      
      // Create new media source
      mediaSrc = URL.createObjectURL(file);
      
      // Detect media type based on file extension
      if (isValidVideo) {
        mediaType = "video";
      } else {
        mediaType = "audio";
      }
      
      statusText = `Media file "${file.name}" loaded successfully`;
      setTimeout(() => statusText = "", 3000);
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
    currentRowIndices = [];

    dialogues.forEach((dialogue, index) => {
      const start = timeToSeconds(dialogue.start);
      const end = timeToSeconds(dialogue.end);

      if (currentTime >= start && currentTime <= end) {
        currentRowIndices.push(index);
      }
    });

    if (currentRowIndices.length > 0) {
      currentRowIndex = currentRowIndices[0];
    //   scrollToCurrentRow();
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
      statusText = "Please enter search text";
      setTimeout(() => statusText = "", 3000);
      return;
    }

    let count = 0;
    dialogues.forEach((dialogue) => {
      if (dialogue.text.includes(searchText)) {
        dialogue.text = dialogue.text.replaceAll(searchText, replaceText);
        count++;
      }
    });

    statusText = `${count} occurrences replaced`;
    setTimeout(() => statusText = "", 3000);
    searchText = "";
    replaceText = "";
    dialogues = [...dialogues];
  }

  function deleteRow(index: number) {
    if (confirm("Are you sure you want to delete this subtitle?")) {
      dialogues.splice(index, 1);
      dialogues = [...dialogues];
      statusText = `Subtitle ${index + 1} deleted`;
      setTimeout(() => statusText = "", 3000);
    }
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
    statusText = `New subtitle added after ${index + 1}`;
    setTimeout(() => statusText = "", 3000);
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
      statusText = "Subtitles exported as ASS format";
      setTimeout(() => statusText = "", 3000);
    } else if (srtFileUrl) {
      // Only SRT format available - export as SRT
      const srtContent = generateSRTContent(dialogues);
      onSave(srtContent);
      statusText = "Subtitles exported as SRT format";
      setTimeout(() => statusText = "", 3000);
    } else {
      // Default to ASS format
      const assContent = generateASSContent(dialogues);
      onSave(assContent);
      statusText = "Subtitles exported as ASS format (default)";
      setTimeout(() => statusText = "", 3000);
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
          isBothFormats: true
        };
        onSave(bothFormats);
      }
      
      statusText = "Subtitles exported (both ASS and SRT formats will be downloaded)";
      setTimeout(() => statusText = "", 3000);
    } catch (error) {
      console.error("Error creating both formats:", error);
      statusText = "Error creating both formats. Exporting ASS format...";
      setTimeout(() => statusText = "", 5000);
    }
  }

  function exportAsASS() {
    const assContent = generateASSContent(dialogues);
    if (onSave) {
      onSave(assContent);
    }
    statusText = "Subtitles exported as ASS format";
    setTimeout(() => statusText = "", 3000);
  }

  function exportAsSRT() {
    const srtContent = generateSRTContent(dialogues);
    if (onSave) {
      onSave(srtContent);
    }
    statusText = "Subtitles exported as SRT format";
    setTimeout(() => statusText = "", 3000);
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
    const hasLongLine = textLines.some(line => line.length > 36);
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
          <span class="text-sm" in:fade={{ duration: 300, delay: 200 }}>{statusText}</span>
        {/if}
        {#if errorMessage}
          <p class="text-error text-xs mt-1" in:fade={{ duration: 300, delay: 200 }}>{errorMessage}</p>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Controls Section -->
  <div class="controls-section bg-base-200 p-4 rounded-lg mb-4">
    <!-- Search and Replace with Close Button -->
    <div class="search-replace flex items-center gap-4 mb-4">
      <div class="flex items-center gap-2">
        <label for="search">Search:</label>
        <input
          id="search"
          type="text"
          bind:value={searchText}
          placeholder="Search text"
          class="input input-sm input-bordered"
        />
      </div>
      <div class="flex items-center gap-2">
        <label for="replace">Replace:</label>
        <input
          id="replace"
          type="text"
          bind:value={replaceText}
          placeholder="Replace text"
          class="input input-sm input-bordered"
        />
      </div>
      <button onclick={searchAndReplace} class="btn btn-primary btn-sm">Replace</button>
      
      <!-- Layout Controls and Close Button -->
      <div class="flex items-center gap-2 ml-auto">
        {#if mediaType === "video" && mediaSrc}
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-sm btn-ghost">
              Switch Layout ⚙️
            </div>
            <ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
              <li><button onclick={() => { useSideBySideLayout = false; isVideoMinimized = false; }}>Standard (Video Top)</button></li>
              <li><button onclick={() => { useSideBySideLayout = true; isVideoMinimized = false; }}>Side-by-Side</button></li>
              <li><button onclick={() => { useSideBySideLayout = false; isVideoMinimized = true; }}>Minimized Video</button></li>
            </ul>
          </div>
        {/if}
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

    <!-- Export Controls -->
    <div class="export-controls flex items-center gap-4">
      <!-- Always show both formats option -->
      <button onclick={exportBothFormats} class="btn btn-primary btn-sm">
        {@html svgIcons.fileExport} Export Both Formats
      </button>
      <div class="">OR</div>
      
      {#if assFileUrl}
        <!-- ASS format available - show individual ASS export -->
        <button onclick={exportAsASS} class="btn btn-success btn-sm">
          {@html svgIcons.fileExport} ASS Only
        </button>
      {:else if srtFileUrl}
        <!-- SRT format available - show individual SRT export -->
        <button onclick={exportAsSRT} class="btn btn-info btn-sm">
          {@html svgIcons.fileExport} SRT Only
        </button>
      {:else}
        <!-- No source format - show both individual options -->
        <button onclick={exportAsASS} class="btn btn-success btn-sm">
          {@html svgIcons.fileExport} ASS Only
        </button>
        <button onclick={exportAsSRT} class="btn btn-info btn-sm">
          {@html svgIcons.fileExport} SRT Only
        </button>
      {/if}
    </div>
  </div>

  <!-- Main Content Area with Layout Switching -->
  <div class="flex-1 flex {useSideBySideLayout ? 'flex-row gap-4' : 'flex-col'} min-h-0">
    <!-- Subtitle Table -->
    <div class="flex-1 bg-base-200 rounded-lg p-4 overflow-auto {useSideBySideLayout ? 'min-w-0' : ''} {isVideoMinimized ? 'min-h-96' : 'min-h-64'}">
      <h3 class="text-lg font-semibold mb-3">Subtitle Table</h3>
      {#if dialogues.length > 0}
        <div class="overflow-x-auto">
          <table class="table table-xs w-full table-fixed">
            <thead>
              <tr class="bg-base-300">
                {#if hasMedia}
                  <th class="w-12">Play</th>
                {/if}
                <th class="w-36">Start</th>
                <th class="w-auto">Text</th>
                <th class="w-36">End</th>
                <th class="w-20">Chars</th>
                <th class="w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each dialogues as dialogue, index}
                <tr
                  data-row-index={index}
                  class="hover:bg-base-200 cursor-pointer transition-colors duration-200 {currentRowIndices.includes(index)
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
                        class="btn btn-xs btn-circle {isPlaying && currentRowIndex === index 
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
                      class="input w-full {currentRowIndices.includes(index) 
                        ? 'input-bordered bg-base-100 text-base-content' 
                        : ''}"
                      placeholder="0:00:00"
                    />
                  </td>
                  <td class="p-1">
                    <textarea
                      bind:value={dialogue.text}
                      onclick={(e) => e.stopPropagation()}
                      oninput={() => {
                        // Trigger reactivity for character count updates
                        updateTrigger++;
                      }}
                      class="textarea w-full resize-none leading-tight {currentRowIndices.includes(index) 
                        ? 'textarea-bordered bg-base-100 text-base-content' 
                        : ''}"
                      rows="2"
                      placeholder="Subtitle text..."
                    ></textarea>
                  </td>
                  <td class="p-1">
                    <input
                      type="text"
                      bind:value={dialogue.end}
                      onclick={(e) => e.stopPropagation()}
                      class="input w-full {currentRowIndices.includes(index) 
                        ? 'input-bordered bg-base-100 text-base-content' 
                        : ''}"
                      placeholder="0:00:00"
                    />
                  </td>
                  <td class="p-1 text-center">
                    <div class="text-sm font-mono {currentRowIndices.includes(index) 
                      ? 'font-bold text-accent-content' 
                      : getCharCountClass(dialogue, updateTrigger)}">
                      {#if dialogue.text.split(/\\N|\\n|\r\n|\r|\n/).length > 1}
                        {@html dialogue.text.split(/\\N|\\n|\r\n|\r|\n/).map(line => line.length).join('<br>')}
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
                        title="Delete"
                      >
                        {@html svgIcons.trash}
                      </button>
                      <button
                        onclick={(e) => {
                          e.stopPropagation();
                          addRowAfter(index);
                        }}
                        class="btn btn-xs btn-outline btn-success join-item"
                        title="Add after"
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
          No subtitles loaded
        </div>
      {/if}
    </div>

    <!-- Media Player Section -->
    <div class="media-section bg-base-200 rounded-lg {useSideBySideLayout ? 'w-96 flex-shrink-0 p-4' : isVideoMinimized ? 'mt-4 flex-shrink-0 h-auto p-2' : 'mt-4 flex-shrink-0 p-4'}">
      {#if hasMedia}
        <!-- Media Status Header -->
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Media Player</h3>
          <div class="flex items-center gap-2">
            <div class="badge badge-success badge-sm gap-1">
              <div class="w-2 h-2 bg-success-content rounded-full"></div>
              {mediaType.toUpperCase()} loaded
            </div>
            {#if mediaType === "video"}
              <button 
                onclick={() => isVideoMinimized = !isVideoMinimized}
                class="btn btn-xs btn-ghost"
                title={isVideoMinimized ? "Show video" : "Minimize video"}
              >
                {isVideoMinimized ? "📹➕" : "📹➖"}
              </button>
            {/if}
            <button
              onclick={() => {
                if (mediaSrc && mediaSrc.startsWith("blob:")) {
                  URL.revokeObjectURL(mediaSrc);
                }
                mediaSrc = "";
                if (mediaFileInput) mediaFileInput.value = "";
                statusText = "Media file removed";
                setTimeout(() => statusText = "", 3000);
              }}
              class="btn btn-xs btn-ghost text-error hover:bg-error/20"
              title="Remove media file"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div class="flex flex-col items-center {isVideoMinimized ? 'gap-2' : 'gap-4'}">
          <!-- Media Content -->

          <!-- Media Element -->
        {#if mediaType === "video"}
          {#if !isVideoMinimized}
            <!-- svelte-ignore a11y_media_has_caption -->
            <video
              bind:this={mediaPlayer}
              src={mediaSrc}
              class="max-w-full {useSideBySideLayout ? 'max-h-48' : 'max-h-24'} bg-black rounded shadow-lg"
              controls
              ontimeupdate={handleTimeUpdate}
              onplay={() => (isPlaying = true)}
              onpause={() => (isPlaying = false)}
              onloadedmetadata={() => (duration = mediaPlayer?.duration || 0)}
            >
            </video>
          {:else}
            <!-- Minimized video - just show a small thumbnail/placeholder -->
            <div class="flex items-center gap-3 bg-base-300 p-3 rounded-lg w-full">
              <div class="w-16 h-10 bg-black rounded flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium">Video Preview (Minimized)</p>
                <p class="text-xs opacity-60">Audio controls still available below</p>
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
            <button onclick={() => seekMedia(-10)} class="btn btn-sm join-item"
              >-10s</button
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
            <label for="speed-select" class="text-sm">Speed:</label>
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
      <h3 class="text-lg font-semibold mb-3">Media Player</h3>
      <p class="mb-3 text-sm text-base-content/70">Upload audio or video file for timeline synchronization</p>
        
        <div class="relative flex flex-col">
          <label
            class={`py-6 relative flex flex-col text-base-content border border-dashed rounded-sm cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
              isDragOver ? "border-info bg-info/10 shadow-lg scale-[1.02]" : "border-neutral-content hover:border-primary/50 hover:bg-primary/5"
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
              <div class="transform transition-transform duration-200 hover:scale-110">
                <svg class="w-12 h-12 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </div>
              <p class="text-base font-semibold text-center transition-colors duration-200 mt-2">
                Add Media File
              </p>
              <p class="text-base text-base-content/70 text-center transition-colors duration-200 mt-1">
                Drag and drop or <span class="text-primary hover:text-primary/80 transition-colors duration-200">click to browse</span>
              </p>
              <div class="flex flex-wrap justify-center gap-2 mt-3">
                <span class="badge badge-outline badge-sm">MP3</span>
                <span class="badge badge-outline badge-sm">WAV</span>
                <span class="badge badge-outline badge-sm">MP4</span>
                <span class="badge badge-outline badge-sm">WebM</span>
                <span class="badge badge-outline badge-sm">MOV</span>
                <span class="badge badge-outline badge-sm">AVI</span>
              </div>
              <p class="text-xs text-base-content/40 mt-4 transition-opacity duration-200 hover:opacity-60">
                Maximum file size: 100MB per file
              </p>
            </div>
          </label>
        </div>

        <!-- Info Text -->
        <div class="mt-4 text-center">
          <p class="text-sm text-base-content/40 leading-relaxed">
            Adding a media file enables timeline synchronization, making it easier to edit subtitles with audio/video context
          </p>
        </div>
    {/if}
  </div>
</div>
</div>
