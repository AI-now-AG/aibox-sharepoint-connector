<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { useTranslations } from "$i18n/utils";

  const dispatch = createEventDispatcher();
  const t = useTranslations();

  export let modal: any;
  export let title: string = "";
  export let description: string = "";
</script>

<dialog id={"modal_confirm_update"} bind:this={modal} class="modal">
  <div class="modal-box">
    <form method="dialog" id="modalForm">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >✕</button
      >

      <h3 id="modal_title" class="text-lg font-bold">
        {title}
      </h3>

      <p class="mt-5 text-md">{description}</p>

      <div class="flex justify-between gap-4 mt-6">
        <button
          id="yes_button"
          class="btn btn-warning flex-1"
          on:click={() => dispatch("confirm")}>{t("common.yes")}</button
        >
        <button
          id="no_button"
          class="btn btn-success flex-1"
          on:click={() => dispatch("dismiss")}>{t("common.no")}</button
        >
      </div>
    </form>
  </div>
</dialog>
