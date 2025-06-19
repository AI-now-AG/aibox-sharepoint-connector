<script lang="ts">
  import { fade } from "svelte/transition";
  import { MessageRole, type MessageHistory } from "$types/MessageHistory";
  import ImageCard from "./ImageCard.svelte";
  import { user } from "$stores";

  interface Props {
    messages: MessageHistory;
    isFetching: boolean;
    isGenerating: boolean;
    infoText?: string;
  }

  let {
    messages = [],
    isFetching = false,
    isGenerating = false,
    infoText = "",
  }: Props = $props();

  let username = $user?.name || $user?.username;
  let userPicture = $user?.picture;
</script>

{#if messages.length > 0 || isFetching}
  <div class="flex-1 h-full">
    <div class="flex flex-wrap h-full">
      <div class="grow md:w-1/2 p-2 pb-4 h-full">
        <div class="grid space-y-6 h-full" transition:fade>
          <div class="flex flex-col">
            <div class="mt-2 overflow-y-scroll h-full min-h-12">
              <div class="card gap-4 chat-container" transition:fade>
                {#each messages as { role, content, imageUrl }, index}
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
                    </div>
                  </div>

                  {#if role === MessageRole.Assistant && imageUrl}
                    <div class="chat-bubble text-base-content bg-base-200">
                      <ImageCard url={imageUrl} alt={content} {infoText} />
                    </div>
                  {/if}
                {/each}
              </div>

              {#if isFetching || isGenerating}
                <div class="card mt-2 gap-4 min-h-[50vh]" transition:fade>
                  {#if isFetching}
                    <div
                      class="chat-bubble bg-base-100 text-base-content flex flex-row"
                    >
                      <span class="loading loading-dots loading-lg"></span>
                    </div>
                  {/if}
                  {#if isGenerating}
                    <div class="skeleton h-80 w-80"></div>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
