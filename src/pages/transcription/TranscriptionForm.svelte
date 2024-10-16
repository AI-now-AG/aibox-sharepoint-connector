<script>
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  const t = useTranslations();
  let isDragging = false;

  function handleDrop(event) {
    event.preventDefault();
    isDragging = false;
    const files = event.dataTransfer.files;
    // Handle the files here
    console.log(files);
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="px-14 mt-10">
  <p>1. {t("transcription.select-transcription-model")}</p>

  <p class="mt-16 mb-2">2. {t("transcription.upload-video-or-audio-file")}</p>
  <div
    class={`relative p-8 border-2 border-dotted rounded-lg text-center 
      ${isDragging ? "border-blue-500" : "border-gray-300"}`}
    on:dragover={() => {
      isDragging = true;
    }}
    on:dragleave={() => {
      isDragging = false;
    }}
    on:drop={() => {
      isDragging = false;
    }}
  >
    <input
      type="file"
      multiple={false}
      class="absolute inset-0 z-50 w-full h-full p-0 m-0 outline-none opacity-0 cursor-pointer"
      on:change={handleDrop}
    />
    <div class="flex flex-col items-center">
        {@html svgIcons.upload}
      <p class="text-base font-semibold">
       {@html t("transcription.input-file-upload-description")}
      </p>
      <p class="text-sm text-gray-500 mt-1">{t("transcription.supportted-file-extensions")}</p>
      <p class="text-xs text-gray-400 mt-8">{t("transcription.maximum-capacity")}</p>
    </div>
  </div>
</div>
