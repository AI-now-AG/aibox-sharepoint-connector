<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { slide, fade } from "svelte/transition";
  import { sharedMessageHistory } from "$components/prompt-interface/components/Stores";
  import ChatInput from "./ChatInput.svelte";
  import ChatResults from "./ChatResults.svelte";
  import { svgIcons } from "$assets/icons";

  let input = $state("");
  let output = $state("");
  let isProcessing = $state(false);

  onDestroy(function () {
    sharedMessageHistory.set([]);
  });

  $inspect(input, output);
</script>

<div class="grid grid-cols-1 grid-rows-[1fr_min-content] space-y-6 h-full">
  <div class="flex flex-col space-y-6">
    <div
      class="min-w-full form-wrapper"
      in:slide={{ duration: 500, delay: 500 }}
      out:slide={{ duration: 500 }}
    >
      <ChatInput bind:input bind:output bind:isProcessing />
    </div>
    <ChatResults bind:output bind:isProcessing />
  </div>
</div>
