<script lang="ts">
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import { MessageRole, type MessageHistory } from "$types/MessageHistory";
  import ImageCard from "./ImageCard.svelte";
  import FileAttachmentList from "./FileAttachmentList.svelte";
  import { user } from "$stores";
  import { useTranslations } from "$i18n/utils";
  import { markdownToHtml, textToHtml } from "$utils/textFormatting";
  import Loading from "$components/Loading.svelte";
  import { addToast } from "$stores/toast";
  import InputDialog from "$components/InputDialog.svelte";
  import { isValidEmail } from "$utils/common";
  import MessageAction from "$components/chat-ui/MessageAction.svelte";
  import { TRANSCRIPTION_API_URL } from "astro:env/client";
  import { marked } from "marked";

  const t = useTranslations();

  interface APIConfiguration {
    apiUrl: string;
    accessToken: string;
  }

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

  let sendEmailToModal: HTMLDialogElement | undefined = $state();
  let toEmail = $state("");
  let sendEmailPromptResultError = $state("");
  let sendEmailPromptResultIndex = $state(0);

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

  function extractTextWithStructure(element: HTMLElement): string {
    let text = "";

    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        switch (el.tagName.toLowerCase()) {
          case "br":
            break;
          case "p":
            text += extractTextWithStructure(el).trim() + "\n\n";
            break;
          case "ul":
            for (const li of el.children) {
              text +=
                "• " +
                extractTextWithStructure(li as HTMLElement).trim() +
                "\n";
            }
            break;
          case "ol":
            let i = 1;
            for (const li of el.children) {
              text +=
                `${i}. ` +
                extractTextWithStructure(li as HTMLElement).trim() +
                "\n";
              i++;
            }
            break;
          case "table":
            text += formatTable(el);
            break;
          case "h1":
          case "h2":
          case "h3":
          case "h4":
          case "h5":
          case "h6":
            text += "\n" + el.textContent.trim() + "\n";
            break;
          default:
            text += extractTextWithStructure(el);
        }
      }
    }

    return text;
  }

  /**
   * Format HTML tables into readable plain text
   */
  function formatTable(table: HTMLElement): string {
    const rows = Array.from(table.querySelectorAll("tr")).map((tr) =>
      Array.from(tr.querySelectorAll("th, td")).map((td) =>
        td.textContent.trim().replace(/\s+/g, " "),
      ),
    );

    if (!rows.length) return "";

    // Compute column widths
    const colWidths = rows[0].map((_, colIndex) =>
      Math.max(...rows.map((row) => (row[colIndex] || "").length)),
    );

    // Build aligned text
    const lines = rows.map((row, rowIndex) =>
      row
        .map((cell, i) => cell.padEnd(colWidths[i] + 2, " "))
        .join("")
        .trimEnd(),
    );

    return lines.join("\n");
  }

  async function copyTextToClipboard(content: string, index: number) {
    marked.setOptions({ breaks: true });
    const html = await marked.parse(content);
    console.log("Original HTML content:\n", html);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const text = extractTextWithStructure(doc.body).trim();
    console.log("------------------------------------------------");
    console.log("Extracted plain text with structure:\n", text);

    try {
      await navigator.clipboard.writeText(text);
      copyIndex = index;
      clearTimeout(timer);
      timer = setTimeout(() => {
        copyIndex = -1;
      }, 2000);
    } catch (err) {
      console.error("Could not copy text: ", err);
    }
  }

  function copyHtmlToClipboard(index: number) {
    const fullHtml = getFullHtmlContent(index, 12);
    const blob = new Blob([fullHtml], { type: "text/html" });
    const data = [new ClipboardItem({ "text/html": blob })];

    navigator.clipboard
      .write(data)
      .then(() => {
        copyIndex = index;
        clearTimeout(timer);
        timer = setTimeout(() => {
          copyIndex = -1;
        }, 2000);
      })
      .catch((err) => {
        console.error("Could not copy HTML content: ", err);
      });
  }

  let username = $user?.name || $user?.username;
  let useremail = $user?.email;
  let userPicture = $user?.picture;

  function removeDownloadButton(htmlString: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    doc.querySelectorAll(".removed-export-pdf").forEach((el) => el.remove());
    return doc.body.innerHTML;
  }

  function getFullHtmlContent(
    index: number = 0,
    fontSize: number = 12,
    isSendMail: boolean = false,
  ): string {
    const textElement = document.getElementById("exportedTextElement-" + index);
    const imageElement = document.getElementById(
      "exportedImageElement-" + index,
    );

    // Escape potentially unsafe characters in text nodes
    const escapeHtml = (str: string) =>
      str
        ?.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;") || "";

    const messageBlock = isSendMail
      ? `<p id="userMessage"><strong>${escapeHtml(
          t("prompt-execution.result.share-via-mail-message", {
            username,
            useremail,
          }),
        )}</strong></p>`
      : "";

    // 1. Get dynamic content
    let textHtml = textElement ? textElement.outerHTML : "<p><br/></p>";
    const imageHtml = imageElement
      ? removeDownloadButton(imageElement.outerHTML)
      : "<p><br/></p>";

    // 2. Clean up HTML
    textHtml = textHtml
      .replace(/ }=""/g, "")
      .replace(/<\/?div[^>]*>/gi, "")
      .replace(/<\/?(colgroup|col|tbody|thead)[^>]*>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<(\/?(table|tr|th|td))\s[^>]*>/gi, "<$1>")
      .replace(/class="[^"]*"/g, "")
      .replace(/style="[^"]*"/g, "")
      .replace(/<p><br\/><\/p>$/gi, "")
      .replace(/\s+([a-z0-9]+)="(\s*)"/gi, ' $1=""')
      .replace(/\s{2,}/g, " ")
      .replace(/<([a-z0-9]+)\s+>/gi, (match, tag) => {
        return `<${tag}>`;
      });

    textHtml = textHtml.trim();

    let finalHtml = `
      <!DOCTYPE html>
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta charset="UTF-8" />
        <title>Prompt Result</title>
        <style>
          body { 
              color: #000;
              font-family: "Times New Roman", serif;
              line-height: normal !important;
          }
          table {
              border-collapse: collapse;
              width: 100%; 
          }
          table, th, td {
              border: 1px solid #000;
          }
          th, td {
              padding: 4pt 8pt;
              word-break: break-word; 
              overflow-wrap: break-word
          }
        </style>
      </head>
      <body style="font-size: ${fontSize}pt;">
        ${messageBlock}
        ${textHtml}
        ${imageHtml}
      </body>
    </html>
  `;

    return finalHtml.replace("*{}", " ").trim();
  }

  async function getAPIConfiguration(): Promise<APIConfiguration> {
    return {
      apiUrl: `${TRANSCRIPTION_API_URL}/api/prompt/export`,
      accessToken: $user?.api_token as string,
    };
  }

  async function exportFileAs(
    fileTpe: "pdf" | "word" = "pdf",
    index: number = 0,
  ) {
    try {
      loading = true;
      const fullHtml = getFullHtmlContent(index, fileTpe === "pdf" ? 14 : 12);

      let filename = `prompt-result-${Date.now()}.${fileTpe === "pdf" ? "pdf" : "docx"}`;

      const config = await getAPIConfiguration();
      const requestBody = {
        html: fullHtml,
        filename: filename,
        fileType: fileTpe,
      };

      const res = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (res.status === 401) {
        addToast({
          message: t("auth.session-missing-force-login"),
          type: "error",
        });
        setTimeout(() => {
          window.location.href = "/api/logout";
        }, 2000);
        return;
      }

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

  async function exportToPDF(index: number = 0) {
    await exportFileAs("pdf", index);
  }

  async function sendMessageResultViaEmail(index: number = 0) {
    try {
      const fullHtml = getFullHtmlContent(index, 12, true);
      const payload = {
        fromName: `${username} (aibox)`,
        to: toEmail,
        subject: t("prompt-execution.result.share-via-mail-subject"),
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

      addToast({
        message: t("prompt-execution.result.share-via-mail-success"),
        type: "success",
      });
    } catch (err) {
      console.error("Error sending email:", err);
      addToast({
        message: t("prompt-execution.result.share-via-mail-failed"),
        type: "error",
      });
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
                        <div class="flex-1 p-4 pt-2.5 min-w-0">
                          <p class="font-bold text-sm">
                            {role == MessageRole.User ? username : `aibox`}
                          </p>
                          <div
                            class="mt-2 text-sm w-full max-w-full break-words whitespace-normal overflow-x-auto"
                            id={`exportedTextElement-${index}`}
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
                        <div class="flex flex-row justify-items-end order-last">
                          <MessageAction
                            exportToPdfAction={() => exportToPDF(index)}
                            sendEmailAction={() => {
                              sendEmailPromptResultIndex = index;
                              sendEmailToModal?.show();
                            }}
                            copyTextToClipboardAction={() =>
                              copyTextToClipboard(content, index)}
                            copyHtmlToClipboardAction={() =>
                              copyHtmlToClipboard(index)}
                            isHideSendEmailAction={imageUrl ? true : false}
                          />
                        </div>
                      {/if}
                    </div>
                  </div>

                  {#if role === MessageRole.Assistant && imageUrl}
                    <div
                      class="chat-bubble text-base-content bg-base-200"
                      id={`exportedImageElement-${index}`}
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

<InputDialog
  bind:modal={sendEmailToModal}
  bind:value={toEmail}
  bind:errorMessage={sendEmailPromptResultError}
  title={"Share AI Prompt Result"}
  label={t("login.email")}
  ctaText={"Send"}
  save={(email: string) => {
    if (!isValidEmail(email)) {
      sendEmailPromptResultError = t("tenant.email-invalid");
    } else {
      sendEmailToModal?.close();
      sendMessageResultViaEmail(sendEmailPromptResultIndex);
      sendEmailPromptResultError = "";
      sendEmailPromptResultIndex = 0;
    }
  }}
/>

<Loading show={loading} />

<style>
  :global([id^="exportedTextElement-"]) {
    max-width: 100%;
    box-sizing: border-box;
  }

  :global([id^="exportedTextElement-"] table) {
    table-layout: auto;
    border-collapse: collapse;
    width: auto; /* do NOT force 100% */
    max-width: none;
    min-width: 0; /* ensure it doesn't force parent's min width */
  }

  :global([id^="exportedTextElement-"] th),
  :global([id^="exportedTextElement-"] td) {
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  :global([id^="exportedTextElement-"] > .overflow-x-auto) {
    contain: inline-size;
    -webkit-overflow-scrolling: touch;
  }
</style>
