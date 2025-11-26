import type { DndOptions, ProcessedFile } from "$types/DndFileUpload";
import { useTranslations } from "$i18n/utils";

export function dndFileUpload(
  node: HTMLElement,
  { enabled = true, acceptedTypes, onDragStart, onDragEnd }: DndOptions = {},
) {
  const t = useTranslations();

  const dragOverClass = "bg-blue-50"; // ← Choose any Tailwind or custom class

  const MAX_IMAGE_SIZE_MB = 7;
  const MAX_OTHER_SIZE_MB = 32;

  /* ---------------------------
   * Utility helpers
   * ---------------------------
   */

  /**
   * Prevents native browser behavior during drag-and-drop.
   * Stops default navigation, file opening, and event bubbling.
   */
  function preventDefaults(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Determines whether a drag event should be ignored.
   *
   * Rules:
   * - Ignore if the DnD handler is disabled.
   * - Ignore if dragging over an element marked with `data-dnd-ignore`.
   */
  function shouldIgnore(e: DragEvent): boolean {
    if (!enabled) return true;
    const el = e.target as HTMLElement | null;
    return !!el?.closest("[data-dnd-ignore]");
  }

  /* ---------------------------
   * Dropzone visual helpers
   * ---------------------------
   */

  function highlight() {
    node.classList.add("dragover", "border-dashed", "border-info", "shadow-xl");
    node.classList.add(dragOverClass);
  }

  /**
   * Removes visual highlight styles from the drop zone after dragging ends.
   */
  function unhighlight() {
    node.classList.remove(
      "dragover",
      "border-dashed",
      "border-info",
      "shadow-xl",
    );
    node.classList.remove(dragOverClass);
  }

  /* ---------------------------
   * File validation helpers
   * ---------------------------
   */

  /**
   * Determine max allowed file size by type.
   *
   * Rules:
   * - Images → 7 MB
   * - PDFs / Other files → 32 MB
   */
  function getMaxSizeForFile(file: File): number {
    if (file.type.startsWith("image/")) {
      return MAX_IMAGE_SIZE_MB;
    }

    return MAX_OTHER_SIZE_MB; // default for PDFs & others
  }

  /**
   * Validate file type + dynamic size limits.
   */
  function validateFile(file: File): string[] {
    const reasons: string[] = [];

    // MIME validation (if provided)
    if (
      acceptedTypes &&
      !Object.values(acceptedTypes).flat().includes(file.type)
    ) {
      reasons.push(t("transcription.file-validation.unsupported-type"));
    }

    // Size validation
    const sizeInMB = file.size / (1024 * 1024);
    const maxSizeMB = getMaxSizeForFile(file);
    if (sizeInMB > maxSizeMB) {
      reasons.push(
        t("prompt-execution.upload-file.max-size-exceeded", {
          size: `${maxSizeMB} MB`,
        }),
      );
    }

    return reasons;
  }

  /* ---------------------------
   * Drag & Drop Event Handlers
   * ---------------------------
   */

  /**
   * Triggered when a file first enters the drop zone.
   * Applies highlight styles and fires `onDragStart`.
   */
  const onDragEnter = (e: DragEvent) => {
    preventDefaults(e);
    if (!shouldIgnore(e)) {
      highlight();
      onDragStart?.();
    }
  };

  /**
   * Triggered repeatedly as a file is dragged over the drop zone.
   * Maintains highlight styles and fires `onDragStart`.
   */
  const onDragOver = (e: DragEvent) => {
    preventDefaults(e);
    if (!shouldIgnore(e)) {
      highlight();
      onDragStart?.();
    }
  };

  /**
   * Triggered when dragging leaves the drop zone area.
   * Removes highlight styles and fires `onDragEnd`.
   */
  const onDragLeave = (e: DragEvent) => {
    preventDefaults(e);
    if (!shouldIgnore(e)) {
      unhighlight();
      onDragEnd?.();
    }
  };

  /**
   * Handles the file drop event:
   * - Clears highlight state
   * - Separates valid and invalid files
   * - Dispatches:
   *   - `filesdropped` with a list of accepted files
   *   - `filesrejected` with a list of rejected files + reasons
   */
  const onDropped = (e: DragEvent) => {
    if (shouldIgnore(e)) return;

    preventDefaults(e);
    unhighlight();
    onDragEnd?.();

    const droppedFiles = Array.from(e.dataTransfer?.files ?? []);
    const accepted: ProcessedFile[] = [];
    const rejected: ProcessedFile[] = [];

    for (const file of droppedFiles) {
      const errors = validateFile(file);
      if (errors?.length) {
        rejected.push({ file, reasons: errors });
      } else {
        accepted.push({ file });
      }
    }

    if (accepted.length) {
      node.dispatchEvent(
        new CustomEvent("filesdropped", {
          detail: accepted,
        }),
      );
    }

    if (rejected.length) {
      node.dispatchEvent(
        new CustomEvent("filesrejected", {
          detail: rejected,
        }),
      );
    }
  };

  /* ---------------------------
   * Event Listener Management
   * ---------------------------
   */

  /**
   * Registers all drag-and-drop event listeners on the DOM node.
   */
  function addListeners() {
    node.addEventListener("dragenter", onDragEnter);
    node.addEventListener("dragover", onDragOver);
    node.addEventListener("dragleave", onDragLeave);
    node.addEventListener("drop", onDropped);
  }

  /**
   * Removes all drag-and-drop event listeners from the DOM node.
   */
  function removeListeners() {
    node.removeEventListener("dragenter", onDragEnter);
    node.removeEventListener("dragover", onDragOver);
    node.removeEventListener("dragleave", onDragLeave);
    node.removeEventListener("drop", onDropped);
  }

  // Initialize if enabled
  if (enabled) addListeners();

  /* ---------------------------
   * Lifecycle Methods (Svelte Action)
   * ---------------------------
   */

  /**
   * Updates options reactively.
   * Enables/disables DnD and updates accepted types.
   * Removes listeners when disabled.
   */
  return {
    update(options: DndOptions) {
      enabled = options.enabled ?? enabled;
      acceptedTypes = options.acceptedTypes ?? acceptedTypes;

      if (!enabled) {
        removeListeners();
        unhighlight();
      } else {
        addListeners();
      }
    },
    destroy() {
      removeListeners();
    },
  };
}
