<script lang="ts">
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  interface Props {
    modal: any;
    title?: string;
    label?: string;
    placeholder?: string;
    value?: string;
    errorMessage?: string;
    ctaText?: string;
    save?: Function;
  }

  let {
    modal = $bindable(),
    title = "",
    label = "",
    placeholder = label,
    value = $bindable(""),
    errorMessage = $bindable(""),
    ctaText = t("common.save"),
    save = () => null,
  }: Props = $props();

  $effect(() => {
    if (value) {
      errorMessage = "";
    }
  });

  function clear() {
    value = "";
    errorMessage = "";
  }
</script>

<dialog
  bind:this={modal}
  class="modal backdrop:bg-black/50"
>
  <div class="modal-box">
    <form method="dialog">
      <span class=" absolute left-6 top-4 mb-2">{title}</span>
      <button
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        onclick={() => {
          clear();
        }}>✕</button
      >
    </form>

    <div class="flex-1 flex flex-col mt-8">
      <span class="mb-2 text-base-content font-medium text-sm">{label}</span>
      <input
        type="text"
        {placeholder}
        class={`input input-bordered w-full${errorMessage ? " border-error/60" : ""}`}
        bind:value
      />
      {#if errorMessage}
        <span class="mt-1 text-error/60 text-sm">{errorMessage}</span>
      {/if}
    </div>

    <div class="flex space-x-2 ml-auto mt-4 justify-end">
      <button
        class="btn btn-primary"
        onclick={() => {
          save?.(value);
        }}
      >
        {ctaText}
      </button>
      <button
        class="btn"
        onclick={() => {
          clear();
          modal.close();
        }}
      >
        {t("common.cancel")}
      </button>
    </div>
  </div>
</dialog>
