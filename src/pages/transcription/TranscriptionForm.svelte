<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  const t = useTranslations();

  let isDragOver = false;

  function addFiles(
    event: Event & { currentTarget: EventTarget & HTMLInputElement },
  ) {
    const eventTarget = event.target as HTMLInputElement;
    const attachedFiles = eventTarget.files[0];
    console.log(attachedFiles);
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="px-14 mt-10">
  <p>1. {t("transcription.select-transcription-model")}</p>

  <p class="mt-16 mb-2">2. {t("transcription.upload-video-or-audio-file")}</p>
  <div class="relative flex flex-col">
    <label
      class={`py-6 relative flex flex-col text-base-content border border-neutral-content border-dashed rounded cursor-pointer ${isDragOver && "border-primary ring-4 ring-inset"}`}
      on:dragover={() => {
        isDragOver = true;
      }}
      on:dragleave={() => {
        isDragOver = false;
      }}
      on:drop={() => {
        isDragOver = false;
      }}
    >
      <input
        type="file"
        multiple
        class="absolute inset-0 z-50 w-full h-full p-0 m-0 outline-none opacity-0 cursor-pointer"
        on:change={addFiles}
      />

      <div class="flex flex-col items-center">
        {@html svgIcons.upload}
        <p class="text-base font-semibold">
          {@html t("transcription.input-file-upload-description")}
        </p>
        <p class="text-sm text-gray-500 mt-1">
          {t("transcription.supportted-file-extensions")}
        </p>
        <p class="text-xs text-gray-400 mt-8">
          {t("transcription.maximum-capacity")}
        </p>
      </div>
    </label>
  </div>
</div>
