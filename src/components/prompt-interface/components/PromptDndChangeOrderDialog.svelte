<script lang="ts">
  import { actions } from "astro:actions";
  import { dndzone } from "svelte-dnd-action";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";
  import LoadingSpinner from "$components/prompt-interface/components/LoadingSpinner.svelte";
  import { svgIcons } from "$assets/icons";
  import log from "$utils/log";

  const t = useTranslations();

  export let promptOrderDialog: HTMLDialogElement;
  export let dialogTitle: string = "Change order";
  export let items: any[] = [];

  let isLoading = false;
  let isSaving = false;

  const flipDurationMs: number = 200;
  const dropTargetStyle: any = {
    outline: "",
  };

  function savePromptOrder() {}
  function cancelEdit() {
    promptOrderDialog.close();
  }

  function handleDndConsider(e: CustomEvent) {
    items = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent) {
    items = e.detail.items;
  }
</script>

<dialog bind:this={promptOrderDialog} class="modal" style="z-index: 100;">
  <div class="modal-box w-8/12 max-w-5xl">
    <div class="flex justify-between">
      <h3 class="text-lg font-bold py-4">{dialogTitle}</h3>
      <button class="btn btn-sm btn-circle btn-ghost" on:click={cancelEdit}>
        {@html svgIcons.closeMenu}
      </button>
    </div>

    <LoadingSpinner bind:isLoading />

    <section
      use:dndzone={{ items, flipDurationMs, dropTargetStyle }}
      on:consider={handleDndConsider}
      on:finalize={handleDndFinalize}
    >
      {#each items as item, index}
        <div
          class="flex items-center bg-base-100 hover:bg-base-300 text-sm rounded-lg py-3 px-4 mt-3 dnd-item"
        >
          <div
            class="flex-none w-64 flex items-center text-sm font-medium rounded-l-lg"
          >
            <span class="inline-flex mr-3">
              {@html svgIcons.drag}
            </span>
            <span class="underline underline-offset-2">{item.title}</span>
          </div>
        </div>
      {/each}
    </section>

    <div class="flex justify-end">
      <button
        class="btn btn-active btn-neutral-content px-8 font-normal mr-2"
        on:click|preventDefault={cancelEdit}
      >
        {t("common.cancel")}
      </button>
      <button
        class={`btn btn-active btn-primary px-8 font-normal ${isSaving && "btn-disabled"}`}
        on:click|preventDefault={savePromptOrder}
      >
        {#if isSaving}
          <span class="loading loading-spinner"></span>
          {t("prompt-library.add.prompts.saving")}
        {:else}
          {t("common.save")}
        {/if}
      </button>
    </div>
  </div>
</dialog>
