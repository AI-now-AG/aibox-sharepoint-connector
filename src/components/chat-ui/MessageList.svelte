<script lang="ts">
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import { MessageRole, type MessageHistory } from "$types/MessageHistory";
  import ImageCard from "./ImageCard.svelte";
  import FileAttachmentList from "./FileAttachmentList.svelte";
  import { svgIcons } from "$assets/icons";
  import { user } from "$stores";
  import { useTranslations } from "$i18n/utils";
  import { markdownToHtml, textToHtml } from "$utils/textFormatting";
  import Loading from "$components/Loading.svelte";
  // import MessageAction from "$components/MessageAction.svelte";

  const t = useTranslations();

  interface Props {
    currentMessage: string;
    currentImageUrl?: string;
    messages: MessageHistory;
    isFetching: boolean;
    isGenerating: boolean;
    isResoningThingking?: boolean;
    infoText?: string;
  }

  let {
    currentMessage = "",
    currentImageUrl = "",
    messages = [],
    isFetching = false,
    isGenerating = false,
    isResoningThingking = false,
    infoText = "",
  }: Props = $props();

  let copyIndex: number = $state(-1);
  let timer: NodeJS.Timeout;
  let loading: boolean = $state(false);

  let exportedTextElement: HTMLElement = $state<any>(null);
  let exportedImageElement: HTMLElement = $state<any>(null);

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

  function removeDownloadButton(htmlString: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    doc.querySelectorAll(".removed-export-pdf").forEach((el) => el.remove());
    return doc.body.innerHTML;
  }

  function getFullHtmlContent() {
    return `
      <html>
        <head>
          <style>
            body {
              font-family: "Helvetica", sans-serif;
              font-size: 16px;
            }

            #imageSection img {
              max-width: 100%;
              max-height: 500px;
              object-fit: contain;
            }

            #messageSection {
              font-size: 16px;
              line-height: 1.6;
            }

            table, th, td {
              border: 1px solid black;
            }

            table {
              border-collapse: collapse; 
            }
          </style>
        </head>
        <body>
          <div id="messageSection">
            ${exportedTextElement ? exportedTextElement.outerHTML : "<br/>"}
          </div>
          <div id="imageSection">
            ${exportedImageElement ? removeDownloadButton(exportedImageElement.outerHTML) : "<br/>"}
          </div>
        </body>
      </html>
    `;
  }

  async function exportFileAs(fileTpe: "pdf" | "word" = "pdf") {
    try {
      const fullHtml = getFullHtmlContent();

      loading = true;

      let filename = `prompt-result-${Date.now()}.${fileTpe === "pdf" ? "pdf" : "docx"}`;

      const res = await fetch(
        fileTpe === "pdf" ? "/api/export-pdf" : "/api/export-word",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html: fullHtml, filename: filename }),
        },
      );

      if (!res.ok) {
        const errorMessage = await res.text();
        throw new Error(`Server conversion failed: ${errorMessage}`);
      }
      const blob = await res.blob();

      const contentDisposition = res.headers.get("Content-Disposition");
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+?)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log(
        `${fileTpe.toUpperCase()} file "${filename}" successfully downloaded.`,
      );
    } catch (error) {
      console.error(`Error exporting as ${fileTpe.toUpperCase()}:`, error);
    } finally {
      loading = false;
    }
  }

  async function exportToPDF() {
    exportFileAs("pdf");
  }

  async function exportToWord() {
    exportFileAs("word");
  }

  async function sendMessageResultViaEmail() {
    try {
      const fullHtml = getFullHtmlContent();
      const payload = {
        to: "hoanghcmus@gmail.com",
        subject: "Shared AI Prompt Result",
        html: fullHtml,
      };
      
      loading = true;
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      alert("✅ Email sent successfully!");
    } catch (err) {
      console.error("Error sending email:", err);
      alert("❌ Failed to send email.");
    } finally {
      loading = false;
    }
  }
</script>

{#if messages.length > 0 || isFetching}
  <div class="flex-1 h-full">
    <div class="flex flex-wrap h-full">
      <div class="grow md:w-1/2 p-2 pb-4 h-full">
        <div class="grid space-y-6 h-full" transition:fade>
          <div class="flex flex-col">
            <div class="mt-2 overflow-y-scroll h-full min-h-screen">
              <div class="card gap-4 chat-container" transition:fade>
                {#each messages as { role, content, rawData = "", imageUrl, fileUrls }, index}
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
                          <div
                            class="mt-2 text-sm"
                            bind:this={exportedTextElement}
                          >
                            {@html role == MessageRole.User
                              ? textToHtml(content)
                              : markdownToHtml(content)}
                          </div>
                          {#if role === MessageRole.User && Array.isArray(fileUrls) && fileUrls.length > 0}
                            <FileAttachmentList {fileUrls} />
                          {/if}
                        </div>
                      {:else}
                        <div class="flex-1 p-4 pt-2.5">
                          <p class="font-bold text-sm">
                            {role == MessageRole.User ? username : `aibox`}
                          </p>
                          <div class="mt-2 text-sm">
                            {t("common.no-content-available")}
                          </div>
                        </div>
                      {/if}
                      {#if role === MessageRole.Assistant}
                        <div>
                          <div
                            class="flex flex-row justify-items-end order-last"
                          >
                            <button
                              onclick={exportToPDF}
                              title="PDF"
                              class="btn p-2 btn-ghost"
                            >
                              {@html svgIcons.pdf}
                            </button>

                            <button
                              onclick={exportToWord}
                              title="Word"
                              class="btn p-2 btn-ghost"
                            >
                              {@html svgIcons.word}
                            </button>

                            <button
                              onclick={() => {
                                sendMessageResultViaEmail();
                              }}
                              title="Email"
                              class="btn p-2 btn-ghost"
                            >
                              {@html svgIcons.email}
                            </button>

                            <button
                              title="Coppy"
                              class="btn p-2 btn-ghost"
                              onclick={() => copyToClipboard(rawData, index)}
                            >
                              {#if index == copyIndex}
                                {@html svgIcons.checkMark}
                              {:else}
                                {@html svgIcons.copyClipboard}
                              {/if}
                            </button>

                            <!-- <MessageAction
                              author={"Steve"}
                              message={getFullHtmlContent()}
                            /> -->
                          </div>
                        </div>
                      {/if}
                    </div>
                  </div>

                  {#if role === MessageRole.Assistant && imageUrl}
                    <div
                      class="chat-bubble text-base-content bg-base-200"
                      bind:this={exportedImageElement}
                    >
                      <ImageCard url={imageUrl} alt={content} {infoText} />
                    </div>
                  {/if}
                {/each}

                {#if currentMessage}
                  <div class="chat-bubble bg-base-100 text-base-content">
                    <div class="flex items-start">
                      <div class="avatar">
                        <div class="w-10 rounded-full">
                          <img src="/aibox-logo-dark.svg" alt="aibox logo" />
                        </div>
                      </div>
                      <div class="flex-1 p-4 pt-2.5">
                        <p class="font-bold text-sm">aibox</p>
                        <div class="mt-2 text-sm">{@html currentMessage}</div>
                      </div>
                    </div>
                  </div>
                {/if}
                <!-- Show streaming image if available -->
                {#if currentImageUrl}
                  <div class="chat-bubble text-base-content bg-base-200">
                    <ImageCard
                      url={currentImageUrl}
                      alt="Generated image"
                      {infoText}
                    />
                  </div>
                {/if}
              </div>

              {#if isFetching || isGenerating}
                <div class="card mt-2 gap-4 min-h-[50vh]" transition:fade>
                  {#if isFetching}
                    <div
                      class="chat-bubble bg-base-100 text-base-content flex flex-row"
                    >
                      <span
                        id="thinking-indicator"
                        class="loading loading-dots loading-lg"
                      ></span>
                      {#if isResoningThingking}
                        <span class="ml-2"
                          >{t("prompt-execution.thinking")}</span
                        >
                      {/if}
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

<Loading show={loading} />
