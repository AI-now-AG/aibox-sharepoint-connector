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
    selectedPackageId?: string;
  }

  let {
    id,
    name = { en: "", de: "" },
    description = { en: "", de: "" },
    features = { en: [], de: [] },
    price,
    currency,
    onSelect,
    selectedPackageId = $bindable(""),
  }: Props = $props();
  const t = useTranslations();
  const lang = getLanguage() ?? "de";

  let backgroundColor = $state("background-color: white;");
  $effect(() => {
    if (selectedPackageId === id) {
      backgroundColor = "background-color: #A1E1F8;";
    } else {
      backgroundColor = "background-color: white;";
    }
  });
  function handleSelect() {
    onSelect?.({ id, name, description, features, price, currency });
  }
</script>

<button
  class="card bg-white shadow-2xl rounded-2xl p-6"
  style={backgroundColor}
  onclick={() => {
    handleSelect();
  }}
>
  <div
    class="absolute top-[-10px] left-0 flex justify-center items-center w-full"
  >
    <div class="badge badge-primary">
      {description?.[lang]}
    </div>
  </div>
  <h2 class="text-xl font-semibold">{name?.[lang]}</h2>
  <p class="text-3xl font-bold my-2">
    {price}
    {currency}
    <span class="text-sm font-normal">/ {t("subscription.per-month")}</span>
  </p>
  <ul class="mt-4 flex flex-col gap-2 text-base text-black">
    {#each features[lang] || [] as feaure}
      <li class="flex items-center">
        <span class="mr-2">
          {@html svgIcons.checkMark}
        </span>
        <span>
          {@html feaure}
        </span>
      </li>
    {/each}
  </ul>
</button>
