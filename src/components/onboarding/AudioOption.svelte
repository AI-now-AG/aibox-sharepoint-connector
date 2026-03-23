<script lang="ts">
  import { useTranslations, getLanguage } from "$i18n/utils";

  interface Props {
    id: string;
    name?: Record<string, string>;
    description?: Record<string, string>;
    features?: Record<string, string[]>;
    price?: number;
    currency?: string;
    pricePrefix?: string;
    onSelect?: Function;
    selectedAudioOptionIds?: string[];
    disabled?: boolean;
  }

  let {
    id,
    name = { en: "", de: "" },
    price,
    currency,
    pricePrefix = "",
    onSelect,
    selectedAudioOptionIds = $bindable([]),
    disabled = false,
  }: Props = $props();

  const t = useTranslations();
  const defaultLanguage = getLanguage();
  let selected: boolean = $state(false);

  let backgroundClass = $state("bg-base-100");
  let textClass = $state("text-base-content");
  $effect(() => {
    if (disabled) {
      backgroundClass = "bg-base-200";
      textClass = "text-base-content/40";
      selected = false;
    } else if (selectedAudioOptionIds.includes(id)) {
      backgroundClass = "bg-primary/10";
      textClass = "text-base-content";
      selected = true;
    } else {
      backgroundClass = "bg-base-100";
      textClass = "text-base-content";
      selected = false;
    }
  });

  function handleSelect() {
    onSelect?.({ id, name, price, currency });
  }
</script>

<button
  class="{backgroundClass} shadow-xl rounded-lg flex justify-between items-center px-6 py-4 w-full transition-all duration-200"
  class:opacity-50={disabled}
  class:cursor-not-allowed={disabled}
  onclick={() => {
    handleSelect();
  }}
  {disabled}
>
  <input
    type="checkbox"
    bind:checked={selected}
    class="checkbox checkbox-primary w-6]"
    value="text-prompt"
    {disabled}
  />
  <h2 class="{textClass} text-sm font-medium text-left flex-1 px-4">
    {name?.[defaultLanguage]}
  </h2>
  <p class="{textClass} text-2xl font-medium text-right">
    {#if pricePrefix}
      <span class="text-base font-medium">{pricePrefix}</span>
    {/if}
    {currency}
    {price}
    <span class="text-base font-medium">/ {t("subscription.per-month")}</span>
  </p>
</button>
