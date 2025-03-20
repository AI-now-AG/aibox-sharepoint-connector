<script lang="ts">
  import { actions } from "astro:actions";
  import type { CreateKnowledgeBaseParams } from "$pages/api/knowledge-base.json";
  import { useTranslations } from "$i18n/utils";
  import { onMount } from "svelte";
  import { addToast } from "$stores/toast";
  import { svgIcons } from "$assets/icons";
  import { formatMarkdown, preventDefault } from "$utils/common";
  import TextEditor from "$components/TextEditor.svelte";
  import ImportFileDialog from "./ImportFileDialog.svelte";
  import Loading from "$components/Loading.svelte";

  const t = useTranslations();
  let loading = $state(false);

  let fileUploadModal: HTMLDialogElement | undefined = $state();
  let inputFile: File | undefined = $state();

  let knowledgeBaseTitle = $state("");
  let knowledgeBaseText = $state("");

  interface Props {
    knowledgeBaseId?: string | undefined;
    knowledgeBase?: any | undefined;
    isEditable?: boolean;
    mode?: "create" | "update" | "clone";
  }

  let {
    knowledgeBaseId = undefined,
    knowledgeBase = undefined,
    isEditable = false,
    mode: screenMode,
  }: Props = $props();

  let mode = $state(screenMode ?? (knowledgeBase ? "update" : "create"));

  let isSaving = $state(false);
  let isFormValid = $derived(
    knowledgeBaseTitle !== "" &&
      knowledgeBaseText.trim() !== "" &&
      knowledgeBaseText.trim() !== "<p></p>",
  );

  onMount(async function () {
    if (knowledgeBase) {
      knowledgeBaseTitle = knowledgeBase.title;
      if (mode == "clone") {
        knowledgeBaseTitle =
          knowledgeBaseTitle?.trim() + " (" + t("common.copy") + ")";
      }
      knowledgeBaseText = formatMarkdown(knowledgeBase.knowledge_base);
    }
  });

  async function extractFileContent() {
    const formData = new FormData();
    formData.append("file", inputFile as File);

    loading = true;
    const { data, error } =
      await actions.knowledgebase.extractFileContent(formData);
    if (error) {
      addToast({
        message: "Something went wrong",
        type: "error",
      });
    } else {
      knowledgeBaseText = data.text;
    }

    loading = false;
  }

  async function saveKnowledgeBase() {
    if (!isFormValid) return;
    isSaving = true;
    try {
      const newKnowledgeBase: CreateKnowledgeBaseParams = {
        title: knowledgeBaseTitle,
        knowledge_base: knowledgeBaseText,
        ...(knowledgeBaseId && { _id: knowledgeBaseId }),
      };

      let httpMethod = mode == "update" ? "PUT" : "POST";
      const response = await fetch("/api/knowledge-base.json", {
        method: httpMethod,
        body: JSON.stringify(newKnowledgeBase),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || t("prompt-library.add.knowledgebase.failed"),
        );
      }

      const data = await response.json();
      window.location.replace("/prompt-library/knowledge-base");

      addToast({
        message: data.message,
        type: "success",
      });
    } catch (error) {
      addToast({
        message:
          error instanceof Error ? error.message : t("common.unexpected.error"),
        type: "error",
      });
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="container max-w-5xl p-6 mx-auto p-4">
  <div class="w-full min-w-xs pt-2 lg:pt-6">
    <div class="flex items-center pt-2 pb-6">
      <button class="mr-4" onclick={() => window.history.back()}>
        {@html svgIcons.back}
      </button>
      <div class="w-full grid grid-cols-1 md:grid-cols-[1fr_max-content] gap-8">
        <h1 class="text-4xl font-bold">
          {#if knowledgeBase}
            {t("prompt-library.knowledgebase.edit")}
          {:else}
            {t("prompt-library.knowledgebase.add")}
          {/if}
        </h1>
        <button
          class="btn btn-outline font-normal grow-0"
          onclick={() => {
            fileUploadModal?.showModal();
          }}
        >
          {t("prompt-library.knowledgebase.file-import")}
        </button>
      </div>
    </div>
    <form class="rounded-sm pt-6 mb-4 space-y-6">
      <div class="grid grid-cols-1 gap-4 justify-center">
        <div>
          <p class="mb-2">{t("prompt-library.add.knowledgebase.title")}*</p>
          <input
            type="text"
            bind:value={knowledgeBaseTitle}
            placeholder="e.g. add knowledge base title"
            class="input input-bordered w-full min-w-xs"
          />
        </div>
      </div>

      <div class="mb-4">
        <p class="mb-2">{t("prompt-library.add.knowledgebase.text")}*</p>
        <TextEditor bind:html={knowledgeBaseText} />
      </div>

      {#if isEditable}
        <div class="flex items-center justify-between">
          <button
            class={`btn btn-active btn-primary px-8 font-normal ${(!isFormValid || isSaving) && "btn-disabled"}`}
            onclick={preventDefault(saveKnowledgeBase)}
          >
            {#if isSaving}
              <span class="loading loading-spinner"></span>
              {t("prompt-library.add.prompts.saving")}
            {:else}
              {t("prompt-library.add.knowledgebase.save")}
            {/if}
          </button>
        </div>
      {/if}
    </form>
  </div>
</div>

<Loading show={loading} />

<ImportFileDialog
  bind:modal={fileUploadModal}
  bind:file={inputFile}
  confirm={extractFileContent}
/>
