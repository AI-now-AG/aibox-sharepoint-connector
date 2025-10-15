<script lang="ts">
  import { fade } from "svelte/transition";
  import { preventDefault } from "$utils/common";
  import { svgIcons } from "$assets/icons";

  interface Props {
    url: string;
    alt?: string;
    infoText?: string;
  }

  let { url = "", alt = "", infoText = "" }: Props = $props();

  function download() {
    if (!url) return;

    try {
      const [prefix, base64String] = url.split(",");
      const mimeMatch = prefix.match(/data:(image\/\w+);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/png";

      const binaryString = atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);

      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: mimeType });
      const fileUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = `generated-image-${Date.now()}.${mimeType.split("/")[1]}`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  }
</script>

{#if url}
  <div class="inline-flex max-w-md group/item relative" transition:fade>
    <img
      src={url}
      alt={alt || "Generated image"}
      class="rounded-lg shadow-lg"
    />
    <div
      class="absolute top-1 right-1 space-x-1 group/edit invisible group-hover/item:visible"
      transition:fade
    >
      {#if infoText}
        <div class="tooltip tooltip-top" data-tip={infoText}>
          <button class="btn btn-square btn-soft btn-primary btn-sm">
            {@html svgIcons.toastInfo}
          </button>
        </div>
      {/if}
      <button
        class="btn btn-square btn-soft btn-primary btn-sm removed-export-pdf"
        onclick={preventDefault(download)}
      >
        {@html svgIcons.download}
      </button>
    </div>
  </div>
{/if}
