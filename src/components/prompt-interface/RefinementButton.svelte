<script lang="ts">
  import { actions } from "astro:actions";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";
  import { preventDefault } from "$utils/common";
  import { svgIcons } from "$assets/icons";
  import type { ApiKeyProvider } from "$types/TenantFeature";
  import { PromptModel } from "$types/PromptModel";
  import { getProviderFromPromptModel } from "$shared/AIProvider";

  interface Props {
    promptText: string;
    selectedModel: string | null;
    isLoading: boolean;
    onResultReady: Function;
    disabled?: boolean;
  }

  let {
    promptText = "",
    selectedModel = null,
    isLoading = $bindable(false),
    onResultReady,
    disabled = false,
  }: Props = $props();

  const t = useTranslations();

  async function improvePromptInstruction() {
    try {
      isLoading = true;
      const provider = getProviderFromPromptModel(
        selectedModel as PromptModel,
      ) as ApiKeyProvider;
      const { data, error } = await actions.prompt.improvePrompt({
        provider,
        instruction: promptText,
      });
      if (error) {
        addToast({ type: "error", message: error?.toString() });
      } else {
        onResultReady(data);
        addToast({
          type: "success",
          message: t(
            "prompt-library.add.prompts.instructions.toast-completed-improvement",
          ),
        });
      }
    } catch (error: any) {
      addToast({ type: "error", message: error?.toString() });
    } finally {
      isLoading = false;
    }
  }
</script>

<button
  class="btn btn-sm absolute top-[-5] right-0 flex"
  onclick={preventDefault(improvePromptInstruction)}
  {disabled}
>
  <span class="">{@html svgIcons.aitool}</span>
  <span class="text-sm font-bold"
    >{t("prompt-library.add.prompts.instructions.improve-instruction")}</span
  >
</button>
