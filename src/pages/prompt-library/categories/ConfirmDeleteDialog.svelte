<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";

  const dispatch = createEventDispatcher();
  const t = useTranslations();

  export let modal;
</script>

<dialog bind:this={modal} class="modal">
  <div class="modal-box">
    <form method="dialog" id="modalForm">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >✕</button
      >
      <h3 class="text-lg font-bold">{t("confirmation.delete.title")}</h3>
      <p class="mt-5 text-md">{t("confirmation.delete.description")}</p>
      <div class="flex justify-between gap-4 mt-6">
        <button
          class="btn btn-warning flex-1"
          on:click={() => dispatch("confirm")}>{t("common.yes")}</button
        >
        <button
          class="btn btn-success flex-1"
          on:click={() => dispatch("dismiss")}>{t("common.no")}</button
        >
      </div>
    </form>
  </div>
</dialog>
