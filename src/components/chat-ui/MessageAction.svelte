<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  interface Props {
    exportToPdfAction: Function;
    exportToWordAction: Function;
    sendEmailAction: Function;
    copyToClipboardAction: Function;
    isHideSendEmailAction?: boolean;
  }
  const {
    exportToPdfAction,
    exportToWordAction,
    sendEmailAction,
    copyToClipboardAction,
    isHideSendEmailAction = false,
  }: Props = $props();

  let open = $state(false);

  function toggleDropdown() {
    open = !open;
  }

  function closeDropdown() {
    open = false;
  }
</script>

<div class="relative inline-block text-left">
  <button
    class="btn btn-ghost flex items-center gap-2"
    onclick={toggleDropdown}
  >
    {@html svgIcons.share}
  </button>

  {#if open}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="absolute right-0 mt-2 min-w-40 rounded-2xl bg-base-100 shadow-lg z-50 border border-base-200"
      onmouseleave={closeDropdown}
    >
      <ul class="menu menu-sm">
        <li>
          <button
            onclick={() => {
              exportToPdfAction?.();
              closeDropdown();
            }}
          >
            {@html svgIcons.pdf}
            <span>{t("prompt-execution.result.export-to-pdf")}</span>
          </button>
        </li>
        <li>
          <button
            onclick={() => {
              exportToWordAction?.();
              closeDropdown();
            }}
          >
            {@html svgIcons.word}
            <span>{t("prompt-execution.result.export-to-word")}</span>
          </button>
        </li>
        {#if !isHideSendEmailAction}
          <li>
            <button
              onclick={() => {
                sendEmailAction?.();
                closeDropdown();
              }}
            >
              {@html svgIcons.email}
              <span>{t("prompt-execution.result.send-via-email")}</span>
            </button>
          </li>
        {/if}
        <li>
          <button
            onclick={() => {
              copyToClipboardAction?.();
              closeDropdown();
            }}
          >
            {@html svgIcons.copyClipboard}
            <span>{t("prompt-execution.result.copy")}</span>
          </button>
        </li>
      </ul>
    </div>
  {/if}
</div>
