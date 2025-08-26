<script lang="ts">
  import Dropdown, { type Option } from "$components/form/Dropdown.svelte";
  import { useTranslations } from "$i18n/utils";
  import { PromptToolOption } from "$types/AIProvider";

  const t = useTranslations();

  interface Props {
    value?: PromptToolOption;
    classes?: string;
    placeholderClasses?: string;
    toolOptions?: Array<Option>;
    disabled?: boolean;
  }

  let {
    value = $bindable(PromptToolOption.None),
    classes = "",
    placeholderClasses = "",
    toolOptions,
    disabled = $bindable(false),
  }: Props = $props();
</script>

{#if Array.isArray(toolOptions) && toolOptions.length > 0}
  <Dropdown
    placeholder={t("prompt-execution.prompt-tool.placeholder")}
    options={toolOptions}
    {classes}
    {placeholderClasses}
    bind:value
    bind:disabled
  />
{/if}
