<script lang="ts">
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import SingleInput from "$pages/prompt-library/prompts/SingleInput.svelte";
  import MultiInput from "$pages/prompt-library/prompts/MultiInput.svelte";
  import ModelInput from "$pages/prompt-library/prompts/ModelInput.svelte";
  import type { CreatePromptParams } from "$pages/api/prompts/index.json";
  import { addToast } from "$stores/toast";
  import { tenant } from "$stores";
  import LoadingSpinner from "$components/prompt-interface/components/LoadingSpinner.svelte";
  import { svgIcons } from "$assets/icons";
  import { preventDefault } from "$utils/common";

  const t = useTranslations();

  interface Props {
    isEditable?: boolean;
    selectedEditPromptId?: any;
    promptDialog?: HTMLDialogElement;
    dialogMode?: "create" | "update" | "clone";
    dialogTitle?: string;
  }

  let {
    isEditable = true,
    selectedEditPromptId = $bindable(null),
    promptDialog = $bindable(),
    dialogMode = "update",
    dialogTitle = t("prompt-library.edit.title"),
  }: Props = $props();

  type Group = { _id: string; title: string }; // TODO: Get the type from the API endpoint
  type Category = {
    _id: string;
    title: string;
    groups: Group[];
  };
  type Model = {
    _id: string;
    title: string;
  };
  type KnowledgeBase = {
    _id: string;
    title: string;
  };

  let categories: Category[] = $state([]);
  let selectedCategory: Category | undefined = $state();

  let models: Model[] = $state([]);
  let selectedModel: Model | null | undefined = $state();

  let knowledgeBases: KnowledgeBase[] = $state([]);
  let selectedKnowledgeBases: KnowledgeBase[] = $state([]);

  let selectedGroup: Group | any = $state();
  let previousCategoryId: string | null = $state(null);

  let promptTitle = $state("");
  let promptText = $state("");
  let promptDetails: any | undefined = undefined;

  let isSaving = $state(false);
  let isLoading = $state(false);

  onMount(async function () {
    const categoryResponse = await fetch("/api/categories.json", {
      method: "GET",
    });
    const categoryData = (await categoryResponse.json()) as Category[];
    if (categoryData) {
      categories = categoryData;
    }

    const knowledgeBaseResponse = await fetch("/api/knowledge-base.json", {
      method: "GET",
    });
    const knowledgeBaseData =
      (await knowledgeBaseResponse.json()) as KnowledgeBase[];
    if (knowledgeBaseData) {
      knowledgeBases = knowledgeBaseData;
    }
  });

  async function getPromptDetail(id: string) {
    isLoading = true;
    try {
      const response = await fetch(`/api/prompts/index.json?_id=${id}`, {
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
      if (dialogMode == "clone") {
        promptTitle = promptTitle?.trim() + " (" + t("common.copy") + ")";
      }
      promptText = promptDetails.prompt;

      const category = categories.find(
        (e) => e._id == promptDetails.category?.toString(),
      );
      if (category) {
        selectedCategory = category;
        previousCategoryId = category._id;
      }

      const model = models.find(
        (e) => e._id == promptDetails.model?.toString(),
      );
      selectedModel = model ?? null;

      const group = category?.groups.find(
        (e) => e._id == promptDetails.group?.toString(),
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
      promptDialog?.close();
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
        model: selectedModel ? selectedModel._id : null,
        knowledgebase: selectedKnowledgeBases.map((inst) => inst._id),
        ...(selectedCategory && { category: selectedCategory._id }),
        ...(selectedGroup && { group: selectedGroup._id }),
        ...(selectedEditPromptId && { _id: selectedEditPromptId }),
      };

      let httpMethod = "PUT"; // FOR UPDATING EXISING
      if (dialogMode == "clone") {
        httpMethod = "POST"; // FOR CREATING NEW
      }
      const response = await fetch("/api/prompts/index.json", {
        method: httpMethod,
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
      }, 0);
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
    promptDialog?.close();
    promptTitle = "";
    promptText = "";
    selectedKnowledgeBases = [];
    selectedEditPromptId = null;
  }

  function handleKeyDown(event: any) {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  }

  $effect(() => {
    if (selectedCategory && selectedCategory._id !== previousCategoryId) {
      selectedGroup = null;
      previousCategoryId = selectedCategory._id;
    }
  });

  let isFormValid = $derived(
    promptTitle?.trim() !== "" &&
      promptText?.trim() !== "" &&
      selectedCategory !== undefined &&
      selectedGroup !== undefined,
  );

  // Fetch prompt details when selectedEditPromptId changes
  $effect(() => {
    if (selectedEditPromptId) {
      getPromptDetail(selectedEditPromptId);
    }
  });
</script>

<dialog class="modal" bind:this={promptDialog}>
  <div class="modal-box w-8/12 max-w-5xl">
    <div class="flex justify-between">
      <h3 class="text-lg font-bold py-4">{dialogTitle}</h3>
      <button class="btn btn-sm btn-circle btn-ghost" onclick={cancelEdit}>
        {@html svgIcons.closeMenu}
      </button>
    </div>
    <LoadingSpinner bind:isLoading />
    <form class="rounded pt-6 space-y-6">
      <div class="grid grid-cols-1 gap-4 justify-center">
        <p class="mb-2">{t("prompt-library.add.prompts.title")}*</p>
        <input
          type="text"
          bind:value={promptTitle}
          placeholder="e.g. Create three sports headlines"
          class="input input-bordered w-full min-w-xs"
          onkeydown={handleKeyDown}
        />
      </div>

      <div class="mb-4">
        <p class="mb-2">{t("prompt-library.add.prompts.instructions")}*</p>
        <textarea
          bind:value={promptText}
          placeholder="e.g. Create three headlines..."
          class="input input-bordered min-w-xs shadow appearance-none min-h-32 w-full py-2 px-3"
        ></textarea>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 justify-center"
      >
        <MultiInput
          title={t("prompt-library.add.prompts.knowledge-base")}
          placeholder="e.g. Knowledge base"
          items={knowledgeBases}
          bind:selectedItems={selectedKnowledgeBases}
        />
        <ModelInput bind:models bind:selectedModel />
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
            onclick={preventDefault(cancelEdit)}
          >
            {t("common.cancel")}
          </button>
          <button
            class={`btn btn-active btn-primary px-8 font-normal ${(!isFormValid || isSaving) && "btn-disabled"}`}
            onclick={preventDefault(savePrompt)}
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
