<script lang="ts">
  import { fade } from "svelte/transition";
  import { addToast } from "$stores/toast";
  import { svgIcons } from "$assets/icons";

  export let output: string = "";

  let isCopied: boolean = false;
  let timer: any;

  function copyToClipboard() {
    addToast({
      message: "Copied",
      type: "success",
    });

    navigator.clipboard
      .writeText(output)
      .then(() => {
        isCopied = true;
        clearTimeout(timer);
        timer = setTimeout(() => {
          isCopied = false;
        }, 3000);
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  }
</script>

<div class="mt-4" transition:fade>
  <div
    class="chat-bubble bg-base-100 text-base-content flex flex-row max-w-full"
  >
    {#if output}
      <p class="py-2">{@html output}</p>
      <div class="flex flex-col justify-items-end order-last">
        <button class="btn p-2 btn-ghost" on:click={copyToClipboard}>
          {#if isCopied}
            {@html svgIcons.copied}
          {:else}
            {@html svgIcons.copy}
          {/if}
        </button>
      </div>
    {/if}
  </div>
</div>
