<script lang="ts">
  import Dropdown, { type Option } from "$components/form/Dropdown.svelte";
  import type { PromptModel } from "$types/PromptModel";
  import { getPromptTools } from "$shared/AIProvider";
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  interface Props {
    promptModel?: PromptModel;
    classes?: string;
    placeholderClasses?: string;
  }

  let { promptModel, classes = "", placeholderClasses = "" }: Props = $props();

  let toolOptions: Array<Option> = $state([]);

  onMount(async function () {
    if (promptModel) {
      toolOptions = (getPromptTools(promptModel) || []) as Option[];
    }
  });
</script>

{#if Array.isArray(toolOptions) && toolOptions.length > 0}
  <Dropdown
    placeholder={t("prompt-execution.prompt-tool.placeholder")}
    options={toolOptions}
    {classes}
    {placeholderClasses}
  />
{/if}
