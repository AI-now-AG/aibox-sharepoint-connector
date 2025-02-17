<script lang="ts">
  import { fade } from "svelte/transition";
  import { onMount, tick } from "svelte";
  import { MessageRole, type MessageHistory } from "$types/MessageHistory";
  import { sharedMessageHistory } from "$components/prompt-interface/components/Stores";
  import { tenant, user } from "$stores";
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
      totalMessages = $sharedMessageHistory.length;
    }
  });

  const handleCopy = (event) => {
    const selection = window.getSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (!range) {
      return;
    }
    event.preventDefault();

    const container = document.createElement("div");
    container.appendChild(range.cloneContents());

    const richText = container.innerHTML;
    const plainText = selection.toString();

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
                            {@html svgIcons.editPrompt}
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
                          {@html svgIcons.editPrompt}
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="0 0 24 24"
                      class="w-8 h-8"
                    >
                      <g stroke="currentColor">
                        <circle
                          cx="12"
                          cy="12"
                          r="9.5"
                          fill="none"
                          stroke-linecap="round"
                          stroke-width="3"
                        >
                          <animate
                            attributeName="stroke-dasharray"
                            calcMode="spline"
                            dur="1.125s"
                            keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
                            keyTimes="0;0.475;0.95;1"
                            repeatCount="indefinite"
                            values="0 150;42 150;42 150;42 150"
                          />
                          <animate
                            attributeName="stroke-dashoffset"
                            calcMode="spline"
                            dur="1.125s"
                            keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
                            keyTimes="0;0.475;0.95;1"
                            repeatCount="indefinite"
                            values="0;-16;-59;-59"
                          />
                        </circle>
                        <animateTransform
                          attributeName="transform"
                          dur="1.5s"
                          repeatCount="indefinite"
                          type="rotate"
                          values="0 12 12;360 12 12"
                        />
                      </g>
                    </svg>
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
