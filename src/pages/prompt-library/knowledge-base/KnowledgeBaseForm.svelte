<script lang="ts">
  import type { CreateKnowledgeBaseParams } from "$pages/api/knowledge-base.json";
  import { useTranslations } from "$i18n/utils";
  import { onMount } from "svelte";
  import { addToast } from "$stores/toast";
  import { svgIcons } from "$assets/icons";
  const t = useTranslations();

  let knowledgeBaseTitle = "";
  let knowledgeBaseText = "";

  export let knowledgeBaseId: string | undefined = undefined;
  export let knowledgeBase: any | undefined = undefined;
  export let isEditable: boolean = false;

  let isSaving = false;
  $: isFormValid =
    knowledgeBaseTitle.trim() !== "" && knowledgeBaseText.trim() !== "";

  onMount(async function () {
    if (knowledgeBase) {
      knowledgeBaseTitle = knowledgeBase.title;
      knowledgeBaseText = knowledgeBase.knowledge_base;
    }
  });

  async function saveInstruction() {
    if (!isFormValid) return;
    isSaving = true;
    try {
      const newInstruction: CreateKnowledgeBaseParams = {
        title: knowledgeBaseTitle,
        knowledge_base: knowledgeBaseText,
        ...(knowledgeBaseId && { _id: knowledgeBaseId }),
      };
      const response = await fetch("/api/knowledge-base.json", {
        method: knowledgeBase ? "PUT" : "POST",
        body: JSON.stringify(newInstruction),
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
      addToast({
        message: data.message,
        type: "success",
      });
    } catch (error) {
      addToast({
        message:
          error instanceof Error
            ? error.message
            : t("common.unexpected.error"),
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
      <button class="mr-4" onclick="window.history.back();">
        {@html svgIcons.back}
      </button>
      <h1 class="text-4xl font-bold">
        {#if knowledgeBase}
          {t("prompt-library.knowledgebase.edit")}
        {:else}
          {t("prompt-library.knowledgebase.add")}
        {/if}
      </h1>
    </div>
    <form class="rounded pt-6 mb-4 space-y-6">
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
        <textarea
          bind:value={knowledgeBaseText}
          placeholder="e.g. type knowledge base details..."
          class="input input-bordered min-w-xs shadow appearance-none min-h-96 w-full py-2 px-3"
        />
      </div>

      {#if isEditable}
        <div class="flex items-center justify-between">
          <button
            class={`btn btn-active btn-primary px-8 font-normal ${(!isFormValid || isSaving) && "btn-disabled"}`}
            on:click|preventDefault={saveInstruction}
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
