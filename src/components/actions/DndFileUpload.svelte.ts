import type { DndOptions, ProcessedFile } from "$types/DndFileUpload";

export function dndFileUpload(
  node: HTMLElement,
  {
    enabled = true,
    maxSize,
    acceptedTypes,
    onDragStart,
    onDragEnd,
  }: DndOptions = {},
) {
  const dragOverClass = "bg-blue-50"; // ← Choose any Tailwind or custom class

  function preventDefaults(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  function shouldIgnore(e: DragEvent): boolean {
    if (!enabled) return true;
    const el = e.target as HTMLElement | null;
    return !!el?.closest("[data-dnd-ignore]");
  }

  function highlight() {
    node.classList.add("dragover", "border-dashed", "border-info", "shadow-xl");
    node.classList.add(dragOverClass);
  }

  function unhighlight() {
    node.classList.remove(
      "dragover",
      "border-dashed",
      "border-info",
      "shadow-xl",
    );
    node.classList.remove(dragOverClass);
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

  const onDragEnter = (e: DragEvent) => {
    preventDefaults(e);
    if (!shouldIgnore(e)) {
      highlight();
      onDragStart?.();
    }
  };

  const onDragOver = (e: DragEvent) => {
    preventDefaults(e);
    if (!shouldIgnore(e)) {
      highlight();
      onDragStart?.();
    }
  };

  const onDragLeave = (e: DragEvent) => {
    preventDefaults(e);
    if (!shouldIgnore(e)) {
      unhighlight();
      onDragEnd?.();
    }
  };

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

  // Register events if enabled
  function addListeners() {
    node.addEventListener("dragenter", onDragEnter);
    node.addEventListener("dragover", onDragOver);
    node.addEventListener("dragleave", onDragLeave);
    node.addEventListener("drop", onDropped);
  }

  function removeListeners() {
    node.removeEventListener("dragenter", onDragEnter);
    node.removeEventListener("dragover", onDragOver);
    node.removeEventListener("dragleave", onDragLeave);
    node.removeEventListener("drop", onDropped);
  }

  // Initialize if enabled
  if (enabled) addListeners();

  return {
    update(options: DndOptions) {
      enabled = options.enabled ?? enabled;
      maxSize = options.maxSize ?? maxSize;
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
