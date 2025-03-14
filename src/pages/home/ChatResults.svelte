<script lang="ts">
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import { MessageRole } from "$types/MessageHistory";
  import { sharedMessageHistory } from "$components/prompt-interface/components/Stores";
  import { user } from "$stores";
  import { svgIcons } from "$assets/icons";

  interface Props {
    output: string;
    isProcessing: boolean;
  }

  let { output = $bindable(""), isProcessing = $bindable(false) }: Props =
    $props();

  let copyIndex: number = $state(-1);
  let timer: NodeJS.Timeout;
  let totalMessages = 0;

  $effect(() => {
    if (
      ($sharedMessageHistory.length > 0 &&
        $sharedMessageHistory.length > totalMessages) ||
      isProcessing
    ) {
      scrollToBottom();
      totalMessages = $sharedMessageHistory.length;
    }
  });

  const scrollToBottom = async () => {
    window?.scroll({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleCopy = (event: any) => {
    const selection = window.getSelection();
    const range =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (!range) {
      return;
    }
    event.preventDefault();

    const container = document.createElement("div");
    container.appendChild(range.cloneContents());

    const richText = container.innerHTML;
    const plainText = (selection ?? "").toString();

    event.clipboardData.setData("text/html", richText);
    event.clipboardData.setData("text/plain", plainText);
  };

  onMount(() => {
    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("copy", handleCopy);
    };
  });

  function copyToClipboard(content: string, index: number) {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        copyIndex = index;
        clearTimeout(timer);
        timer = setTimeout(() => {
          copyIndex = -1;
        }, 2000);
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  }

  let username = $user?.name || $user?.username;
  let userPicture = $user?.picture;
</script>

{#if output || $sharedMessageHistory.length > 0 || isProcessing}
  <div class="flex-1 h-full">
    <div class="flex flex-wrap h-full">
      <div class="grow md:w-1/2 p-2 pb-4 h-full">
        <div class="grid space-y-6 h-full" transition:fade>
          <div class="flex flex-col">
            <div class="mt-2 overflow-y-scroll h-full min-h-12">
              <div class="card gap-4" transition:fade>
                {#each $sharedMessageHistory as { role, content, rawData }, index}
                  <div
                    class={`chat-bubble text-base-content ${role === MessageRole.User ? `bg-base-200` : `bg-base-100`}`}
                  >
                    <div class="flex items-start">
                      <!-- Avatar -->
                      <div class="avatar">
                        <div class="w-10 rounded-full">
                          {#if role === MessageRole.User}
                            <!-- svelte-ignore a11y_img_redundant_alt -->
                            <img alt="Avatar Image" src={userPicture} />
                          {:else}
                            <img src="/aibox-logo-dark.svg" alt="dark logo" />
                          {/if}
                        </div>
                      </div>

                      {#if content}
                        <div class="flex-1 p-4 pt-2.5">
                          <p class="font-bold text-sm">
                            {role == MessageRole.User ? username : `aibox`}
                          </p>
                          <p class="mt-2 text-sm">{@html content}</p>
                        </div>
                      {/if}

                      {#if role === MessageRole.Assistant}
                        <div>
                          <div
                            class="flex flex-col justify-items-end order-last"
                          >
                            <button
                              class="btn p-2 btn-ghost"
                              onclick={() => copyToClipboard(rawData, index)}
                            >
                              {#if index == copyIndex}
                                {@html svgIcons.checkMark}
                              {:else}
                                {@html svgIcons.copyClipboard}
                              {/if}
                            </button>
                          </div>
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>

              {#if output}
                <div class="pt-4">
                  <div class={`chat-bubble text-base-content bg-base-100`}>
                    <div class="flex items-start">
                      <!-- Avatar -->
                      <div class="avatar">
                        <div class="w-10 rounded-full">
                          <img src="/aibox-logo-dark.svg" alt="light Logo" />
                        </div>
                      </div>

                      <div class="flex-1 p-4 pt-2.5">
                        <p class="font-bold text-sm">aibox</p>
                        <p class="mt-2 text-sm">{@html output}</p>
                      </div>
                    </div>
                  </div>
                </div>
              {/if}
              {#if isProcessing}
                <div class="card mt-2 gap-4" transition:fade>
                  <!-- Latest Output -->
                  <div
                    class="chat-bubble bg-base-100 text-base-content flex flex-row"
                  >
                    {@html svgIcons.spinner}
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
