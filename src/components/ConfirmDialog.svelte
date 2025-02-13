<script lang="ts">
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  interface Props {
    modal: any;
    confirm: any;
    title?: string;
    description?: string;
  }

  let {
    modal = $bindable(),
    confirm,
    title = "",
    description = "",
  }: Props = $props();
</script>

<dialog bind:this={modal} class="modal">
  <div class="modal-box">
    <form method="dialog" id="modalForm">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >✕</button
      >

      {#if title}
        <h3 class="text-lg font-bold">
          {title}
        </h3>
      {/if}

      <p class="mt-5 text-md">{description}</p>

      <div class="flex justify-between gap-4 mt-6">
        <button
          id="yes_button"
          class="btn btn-warning flex-1"
          onclick={() => confirm()}>{t("common.yes")}</button
        >
        <button id="no_button" class="btn btn-success flex-1" onclick={() => {}}
          >{t("common.no")}</button
        >
      </div>
    </form>
  </div>
</dialog>
