<script>
  import { onMount, onDestroy } from "svelte";
  import { slide, fade } from "svelte/transition";
  import ExecutionCard from "$components/prompt-interface/components/ExecutionCard.svelte";
  import { sharedMessageHistory } from "$components/prompt-interface/components/Stores";
  import InputArea from "./Input.svelte";
  import PromptResults from "./PromptResults.svelte";
  import { svgIcons } from "$assets/icons";

  export let promptItems;
  export let isEditable = false;

  let selectedPromptId;
  let input = "";
  let output = "";
  let isProcessing = false;
  let showButton = false;
  let isFixed = false;

  onMount(() => {
    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } =
        document.documentElement;

      if (Math.abs(scrollHeight - clientHeight - scrollTop) > 100) {
        if (!showButton) showButton = true;
      } else {
        if (showButton) showButton = false;
      }
    };
    window.addEventListener("scroll", handleScroll);
  });

  const scrollToBottom = async () => {
    window.scroll({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  $: if (input && !isFixed) {
    setTimeout(() => {
      isFixed = true;
    }, 500);
  }

  $: if (selectedPromptId) {
    sharedMessageHistory.set([]);
  }

  onDestroy(function () {
    sharedMessageHistory.set([]);
  });
</script>

<div class="grid grid-cols-1 grid-rows-[1fr_min-content] space-y-6 h-full">
  <div class="flex flex-col space-y-6">
    <p class="text-base font-normal">
      {#if selectedPromptId}
        {promptItems.filter((e) => e._id === selectedPromptId)[0].description}
      {/if}
    </p>
    <ExecutionCard cards={promptItems} bind:selectedPromptId bind:isEditable />
    {#if $sharedMessageHistory.length == 0}
      <div
        class="min-w-full form-wrapper"
        in:slide={{ duration: 500, delay: 500 }}
        out:slide={{ duration: 500 }}
      >
        <InputArea
          bind:promptId={selectedPromptId}
          bind:input
          bind:output
          bind:isProcessing
        />
      </div>
    {/if}
    <PromptResults bind:output bind:isProcessing />
  </div>
  <!-- <InputArea bind:promptId={selectedPromptId} bind:input bind:output /> -->

  <div class="sticky bottom-0 bg-base-200" transition:slide={{ duration: 500 }}>
    {#if $sharedMessageHistory.length > 0}
      {#if showButton}
        <div class="relative w-full flex justify-center">
          <button
            class="absolute shadow-lg hover:shadow-2xl self-center bottom-2 btn btn-sm btn-circle"
            on:click={() => {
              scrollToBottom();
            }}
          >
            {@html svgIcons.downIcon}
          </button>
        </div>
      {/if}
      <div
        class="inset-x-0 bottom-0 min-w-full form-wrapper"
        out:slide={{ duration: 500 }}
        in:slide={{ duration: 500, delay: 500 }}
      >
        <InputArea
          bind:promptId={selectedPromptId}
          bind:input
          bind:output
          bind:isProcessing
        />
      </div>
    {/if}
  </div>
</div>
