<script lang="ts">
  import Loading from "$components/Loading.svelte";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import { preventDefault } from "$utils/common";
  import { actions } from "astro:actions";

  const t = useTranslations();

  interface Props {
    configurationId: string;
    promptRefinementInstruction: string;
  }

  let { configurationId, promptRefinementInstruction }: Props = $props();
  let loading: boolean = $state(false);

  async function savePrompt() {
    loading = true;
    const { error } = await actions.configurations.update({
      _id: configurationId,
      promptRefinementInstruction,
    });

    if (!error) {
      addToast({
        message: t("prompt-refinement.update-setting-successfull"),
        type: "success",
      });
    } else {
      addToast({
        message:
          t("prompt-refinement.update-setting-failed") + JSON.stringify(error),
        type: "error",
      });
    }
    loading = false;
  }
</script>

<form onsubmit={preventDefault(savePrompt)}>
  <div class="card shadow-lg my-6">
    <div class={`card-body bg-base-100 rounded-xl`}>
      <textarea
        id="prompt-improvement"
        class="textarea textarea-bordered h-64 w-full"
        bind:value={promptRefinementInstruction}
      ></textarea>

      <div class="mt-3 text-right">
        <button
          type="submit"
          class="btn btn-primary"
          onclick={preventDefault(savePrompt)}
        >
          {t("common.save")}
        </button>
      </div>
    </div>
  </div>
</form>

<Loading show={loading} />
