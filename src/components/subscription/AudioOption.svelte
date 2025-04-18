<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { getLanguage, useTranslations } from "$i18n/utils";

  interface Props {
    id: string;
    name?: Record<string, string>;
    description?: Record<string, string>;
    features?: Record<string, string[]>;
    price?: number;
    currency?: string;
    onSelect?: Function;
    selectedAudioOptionIds?: string[];
  }

  let {
    id,
    name = { en: "", de: "" },
    price,
    currency,
    onSelect,
    selectedAudioOptionIds = $bindable([]),
  }: Props = $props();

  const t = useTranslations();
  const lang = getLanguage() ?? "de";
  let selected: boolean = $state(false);

  let backgroundColor = $state("background-color: white;");
  $effect(() => {
    if (selectedAudioOptionIds.includes(id)) {
      backgroundColor = "background-color: #A1E1F8;";
      selected = true;
    } else {
      backgroundColor = "background-color: white;";
      selected = false;
    }
  });

  function handleSelect() {
    onSelect?.({ id, name, price, currency });
  }
</script>

<button
  class="bg-white shadow-xl rounded-lg flex justify-between items-center px-6 py-4 w-full"
  style={backgroundColor}
  onclick={() => {
    handleSelect();
  }}
>
  <input
    type="checkbox"
    bind:checked={selected}
    class="checkbox checkbox-primary w-6]"
    value="text-prompt"
  />
  <h2 class="text-sm font-medium text-[#0F172A] text-left flex-1 px-4">
    {name?.[lang]}
  </h2>
  <p class="text-2xl font-medium text-right text-[#0F172A]">
    {price}
    {currency}
    <span class="text-base font-medium">/ {t("subscription.per-month")}</span>
  </p>
</button>
