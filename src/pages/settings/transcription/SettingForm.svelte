<script lang="ts">
  import { actions } from "astro:actions";
  import { useTranslations } from "$i18n/utils";
  import { tenant, loading } from "$stores";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";

  const t = useTranslations();

  export let instructions: string = "";

  let isSaving = false;

  async function save() {
    $loading = true;
    isSaving = true;

    const { error } = await actions.transcription_settings.update({
      _id: $tenant._id,
      instructions,
    });
    $loading = false;
    isSaving = false;

    if (error) {
      addToast({
        message: error,
        type: "error",
      });
    } else {
      addToast({
        message: "Updated",
        type: "success",
      });
    }
  }
</script>

<div class="container max-w-full mx-auto p-6" style="font-family: Inter;">
  <div class="max-w-full">
    <p class="mb-2">{t("settings.transcription.instructions")}</p>
    <div class="mb-4">
      <textarea
        placeholder={t("settings.transcription.instructions-placeholder")}
        class="input input-bordered min-w-xs shadow appearance-none min-h-80 w-full py-2 px-3"
        bind:value={instructions}
      ></textarea>
    </div>

    <button
      class={`btn btn-active btn-primary px-8 font-normal ${isSaving && "btn-disabled"}`}
      on:click|preventDefault={save}
    >
      {t("common.save")}
    </button>
  </div>
</div>

<Loading bind:show={$loading} />
