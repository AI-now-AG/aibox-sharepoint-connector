import type { DndOptions, ProcessedFile } from "$types/DndFileUpload";

export function dndFileUpload(
  node: HTMLElement,
  { enabled = true, maxSize, acceptedTypes }: DndOptions = {},
) {
  function preventDefaults(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight() {
    if (!enabled) return;
    node.classList.add("dragover", "border-dashed", "border-info", "shadow-xl");
  }

  function unhighlight() {
    node.classList.remove(
      "dragover",
      "border-dashed",
      "border-info",
      "shadow-xl",
    );
  }

  function validateFile(file: File): string[] {
    const reasons: string[] = [];
    if (
      acceptedTypes &&
      !Object.values(acceptedTypes).flat().includes(file.type)
    ) {
      reasons.push("INVALID_MIMETYPE");
    }
    if (maxSize && file.size > maxSize) {
      reasons.push("FILE_TOO_LARGE");
    }

    return reasons;
  }

  function handleDrop(e: DragEvent) {
    if (!enabled) return;

    preventDefaults(e);
    unhighlight();

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
  }

  const events = ["dragenter", "dragover", "dragleave", "drop"];

  function addListeners() {
    for (const evt of events) node.addEventListener(evt, preventDefaults);
    node.addEventListener("dragenter", highlight);
    node.addEventListener("dragover", highlight);
    node.addEventListener("dragleave", unhighlight);
    node.addEventListener("drop", handleDrop);
  }

  function removeListeners() {
    for (const evt of events) node.removeEventListener(evt, preventDefaults);
    node.removeEventListener("dragenter", highlight);
    node.removeEventListener("dragover", highlight);
    node.removeEventListener("dragleave", unhighlight);
    node.removeEventListener("drop", handleDrop);
  }

  // Initialize if enabled
  if (enabled) addListeners();

  return {
    update(newEnabled: boolean) {
      enabled = newEnabled;
      if (!enabled) unhighlight();
    },
    destroy() {
      removeListeners();
    },
  };
}
