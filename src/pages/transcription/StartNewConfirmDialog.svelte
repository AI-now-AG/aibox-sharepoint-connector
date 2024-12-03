<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";

  const dispatch = createEventDispatcher();
  const t = useTranslations();

  export let modal;
  export let isZipDataPresent: boolean;
  export let isFileDataPresent: boolean;
</script>

<dialog id={"modal_confirm_start_new"} bind:this={modal} class="modal">
  <div class="modal-box">
    <form method="dialog" id="modalForm">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >✕</button
      >
      <h3 id="modal_title" class="text-base">
        {t("transcription.start-new")}
      </h3>

      <div class="mt-6 mb-8 flex flex-col justify-center items-center">
        {@html svgIcons.startNew}
        <p class="text-center mt-6 font-semibold text-lg">
          {t("transcription.start-new-popup.title")}
        </p>
        <p class="text-center mt-4 text-gray-500">
          {t("transcription.start-new-popup.sub-title")}
        </p>
      </div>

      <div class="flex flex-col gap-4 mt-16">
        <button class="btn btn-sm" on:click={() => dispatch("confirm")}
          >{t("transcription.start-new")}</button
        >
        <button class="btn btn-active btn-primary btn-sm text-base-100"
          >{t("common.cancel")}</button
        >
        {#if isZipDataPresent}
          <button
            id="no_button"
            class="btn btn-active btn-primary btn-sm text-base-100"
            on:click={() => dispatch("downloadZip")}
            >{t("transciption.model.cta.download-zip")}</button
          >
        {:else if isFileDataPresent}
          <button
            id="no_button"
            class="btn btn-active btn-primary btn-sm text-base-100"
            on:click={() => dispatch("downloadFile")}
            >{t("transciption.model.cta.download-output")}</button
          >
        {/if}
        <!-- <button
          id="no_button"
          class="btn btn-active btn-primary btn-sm text-base-100"
          on:click={() => dispatch("downloadSRT")}
          >{t("transcription.dowload-srt-file.srt")}</button
        > -->
      </div>
    </form>
  </div>
</dialog>
