<script lang="ts">
  import { fade } from "svelte/transition";
  import { preventDefault } from "$utils/common";
  import { svgIcons } from "$assets/icons";

  interface Props {
    url: string;
    alt?: string;
  }

  let { url = "", alt = "" }: Props = $props();

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
  <div class="inline-flex max-w-md relative">
    <img
      src={url}
      alt={alt || "Generated image"}
      class="rounded-lg shadow-lg"
    />
    <button
      class="btn btn-square btn-soft btn-primary btn-sm absolute top-1 right-1"
      onclick={preventDefault(download)}
    >
      {@html svgIcons.download}
    </button>
  </div>
{/if}
