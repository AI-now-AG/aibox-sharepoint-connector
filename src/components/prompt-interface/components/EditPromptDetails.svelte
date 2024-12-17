<script lang="ts">
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";

  import SingleInput from "$pages/prompt-library/prompts/SingleInput.svelte";
  import MultiInput from "$pages/prompt-library/prompts/MultiInput.svelte";
  import type { CreatePromptParams } from "$pages/api/prompts/index.json";
  import { addToast } from "$stores/toast";
  import LoadingSpinner from "$components/prompt-interface/components/LoadingSpinner.svelte";
  import { svgIcons } from "$assets/icons";
  const t = useTranslations();
  export let dlgEl: HTMLDialogElement;

  export let selectedEditPromptId: any = null;
  type Group = { title: string; _id: string }; // TODO: Get the type from the API endpoint
  type Category = {
    title: string;
    _id: string;
    groups: Group[];
  };

  type KnowledgeBase = {
    title: string;
    _id: string;
  };

  let categories: Category[] = [];
  let selectedCategory: Category;
  let selectedGroup: Group | any;

  let previousCategoryId: string | null = null;
  $: if (selectedCategory && selectedCategory._id !== previousCategoryId) {
    selectedGroup = null;
    previousCategoryId = selectedCategory._id;
  }

  let knowledgeBases: KnowledgeBase[] = [];
  let selectedKnowledgeBases: KnowledgeBase[] = [];

  let promptTitle = "";
  let promptText = "";

  let promptDetails: any | undefined = undefined;
  export let isEditable: boolean = true;
  let isSaving = false;
  $: isFormValid =
    promptTitle.trim() !== "" &&
    promptText.trim() !== "" &&
    selectedCategory !== undefined &&
    selectedGroup !== undefined;
  let isLoading = false;

  // Fetch prompt details when selectedEditPromptId changes
  $: if (selectedEditPromptId) {
    getPromptDetail(selectedEditPromptId);
  }

  onMount(async function () {
    const response = await fetch("/api/categories.json", { method: "GET" });
    const data = await response.json();
    if (data) {
      categories = data;
    }
    await fetchInstructionAndKB();
  });

  async function fetchInstructionAndKB() {
    const knowledgeBaseResponse = await fetch("/api/knowledge-base.json", {
      method: "GET",
    });
    const knowledgeBaseData =
      (await knowledgeBaseResponse.json()) as KnowledgeBase[];
    if (knowledgeBaseData) {
      knowledgeBases = knowledgeBaseData;
    }
  }

  async function getPromptDetail(id: string) {
    isLoading = true;
    try {
      const response = await fetch(`/api/prompts.json?_id=${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            "Failed to get prompt details. Please try again.",
        );
      }

      promptDetails = await response.json();
      promptTitle = promptDetails.title;
      promptText = promptDetails.prompt;

      const category = categories.find(
        (e) => e._id == promptDetails.category.toString(),
      );
      if (category) {
        selectedCategory = category;
        previousCategoryId = category._id;
      }

      const group = category?.groups.find(
        (e) => e._id == promptDetails.group.toString(),
      );
      if (group) {
        selectedGroup = group;
      }
      selectedKnowledgeBases = promptDetails.knowledgebase
        .map((kbObj: any) =>
          knowledgeBases.find((e) => e._id == kbObj._id.toString()),
        )
        .filter((kb: any) => kb !== undefined) as KnowledgeBase[];
    } catch (error) {
      dlgEl.close();
      addToast({
        message:
          error instanceof Error ? error.message : t("common.unexpected.error"),
        type: "error",
      });
    } finally {
      isLoading = false;
    }
  }

  async function savePrompt() {
    if (!isFormValid) return;
    isSaving = true;
    try {
      const newPrompt: CreatePromptParams = {
        title: promptTitle,
        prompt: promptText,
        knowledgebase: selectedKnowledgeBases.map((inst) => inst._id),
        ...(selectedCategory && { category: selectedCategory._id }),
        ...(selectedGroup && { group: selectedGroup._id }),
        ...(selectedEditPromptId && { _id: selectedEditPromptId }),
      };
      console.log(newPrompt);
      const response = await fetch("/api/prompts.json", {
        method: "PUT",
        body: JSON.stringify(newPrompt),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || t("prompt-library.add.prompt.failed"),
        );
      }

      const data = await response.json();
      addToast({
        message: data.message,
        type: "success",
      });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
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

  function cancelEdit() {
    dlgEl.close();
    promptTitle = "";
    promptText = "";
    selectedKnowledgeBases = [];
    selectedEditPromptId = null;
  }
</script>

<dialog class="modal" bind:this={dlgEl}>
  <div class="modal-box w-8/12 max-w-5xl">
    <div class="flex justify-between">
      <h3 class="text-lg font-bold py-4">{t("prompt-library.edit.title")}</h3>
      <button class="btn btn-sm btn-circle btn-ghost" on:click={cancelEdit}>
        {@html svgIcons.closeMenu}
      </button>
    </div>
    <LoadingSpinner bind:isLoading />
    <form class="rounded pt-6 mb-4 space-y-6">
      <div class="grid grid-cols-1 gap-4 justify-center">
        <div>
          <p class="mb-2">{t("prompt-library.add.prompts.title")}*</p>
          <input
            type="text"
            bind:value={promptTitle}
            placeholder="e.g. Create three sports headlines"
            class="input input-bordered w-full min-w-xs"
          />
        </div>
      </div>

      <div class="mb-4">
        <p class="mb-2">{t("prompt-library.add.prompts.instructions")}*</p>
        <textarea
          bind:value={promptText}
          placeholder="e.g. Create three headlines..."
          class="input input-bordered min-w-xs shadow appearance-none min-h-32 w-full py-2 px-3"
        />
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 justify-center"
      >
        <!-- <MultiInput
          title={t("prompt-library.add.prompts.instructions")}
          placeholder="e.g. Instruction"
          items={instructions}
          bind:selectedItems={selectedInstructions}
        /> -->

        <MultiInput
          title={t("prompt-library.add.prompts.knowledge-base")}
          placeholder="e.g. Knowledge base"
          items={knowledgeBases}
          bind:selectedItems={selectedKnowledgeBases}
        />
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 justify-center"
      >
        <SingleInput
          title={`${t("prompt-library.add.prompts.category")}*`}
          placeholder="e.g. Editing"
          items={categories}
          bind:selectedItem={selectedCategory}
        />

        {#if selectedCategory}
          <SingleInput
            title={`${t("prompt-library.add.prompts.group")}*`}
            placeholder="e.g. Headlines"
            items={selectedCategory.groups}
            bind:selectedItem={selectedGroup}
          />
        {/if}
      </div>

      {#if isEditable}
        <div class="flex justify-end">
          <button
            class="btn btn-active btn-neutral-content px-8 font-normal mr-2"
            on:click|preventDefault={cancelEdit}
          >
            {t("common.cancel")}
          </button>
          <button
            class={`btn btn-active btn-primary px-8 font-normal ${(!isFormValid || isSaving) && "btn-disabled"}`}
            on:click|preventDefault={savePrompt}
          >
            {#if isSaving}
              <span class="loading loading-spinner"></span>
              {t("prompt-library.add.prompts.saving")}
            {:else}
              {t("prompt-library.add.prompts.save")}
            {/if}
          </button>
        </div>
      {/if}
    </form>
  </div>
</dialog>
