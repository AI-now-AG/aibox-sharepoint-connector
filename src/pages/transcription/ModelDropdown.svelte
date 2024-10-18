<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";

  const dispatch = createEventDispatcher();
  const t = useTranslations();

  const items = [
    { value: "large", text: t("transciption.model.size.large") },
    { value: "medium", text: t("transciption.model.size.medium") },
    { value: "small", text: t("transciption.model.size.small") },
    { value: "base", text: t("transciption.model.size.base") },
    { value: "tiny", text: t("transciption.model.size.tiny") },
  ];
  export let value = "";
</script>

<select
  class="select select-ghost bg-transparent underline"
  bind:value
  on:change={() => dispatch("change", value)}
>
  <option disabled>{t("transciption.model")}</option>
  {#each items as item}
    <option value={item.value}>{item.text}</option>
  {/each}
</select>
