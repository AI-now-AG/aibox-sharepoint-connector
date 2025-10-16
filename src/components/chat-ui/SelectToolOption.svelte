<!-- svelte-ignore event_directive_deprecated -->
<script lang="ts">
  import Dropdown, { type Option } from "$components/form/Dropdown.svelte";
  import { useTranslations } from "$i18n/utils";
  import { PromptToolOption } from "$types/AIProvider";
  import { svgIcons } from "$assets/icons";

  const t = useTranslations();

  interface Props {
    value?: PromptToolOption;
    classes?: string;
    placeholderClasses?: string;
    dropdownBoxClasses?: string;
    toolOptions?: Array<Option>;
    disabled?: boolean;
  }

  let {
    value = $bindable(PromptToolOption.None),
    classes = "",
    placeholderClasses = "",
    dropdownBoxClasses = "",
    toolOptions,
    disabled = false,
  }: Props = $props();
</script>

{#if Array.isArray(toolOptions) && toolOptions.length > 0}
  <div class="flex items-center">
    <Dropdown
      placeholder={t("prompt-execution.prompt-tool.placeholder")}
      options={toolOptions}
      {classes}
      {placeholderClasses}
      {dropdownBoxClasses}
      bind:value
      {disabled}
    />
    {#if !disabled && value && (value as PromptToolOption) !== PromptToolOption.None}
      <button
        class="btn btn-ghost h-8 p-0 min-h-0 aspect-square ml-1"
        on:click|preventDefault={() => {
          value = PromptToolOption.None;
        }}
      >
        {@html svgIcons.close}</button
      >
    {/if}
  </div>
{/if}
