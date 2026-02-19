<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  interface Props {
    exportToPdfAction: Function;
    sendEmailAction: Function;
    sendEmailViaFlowmateAction?: Function;
    copyTextToClipboardAction: Function;
    copyHtmlToClipboardAction: Function;
    isHideSendEmailAction?: boolean;
  }
  const {
    exportToPdfAction,
    sendEmailAction,
    sendEmailViaFlowmateAction,
    copyTextToClipboardAction,
    copyHtmlToClipboardAction,
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
      <ul class="menu menu-md w-full">
        <li>
          <button
            onclick={() => {
              exportToPdfAction?.();
              closeDropdown();
            }}
          >
            <span>{t("prompt-execution.result.export-to-pdf")}</span>
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
              <span>{t("prompt-execution.result.send-via-email")}</span>
            </button>
          </li>
          {#if sendEmailViaFlowmateAction}
            <li>
              <button
                onclick={() => {
                  sendEmailViaFlowmateAction?.();
                  closeDropdown();
                }}
              >
                <span>{t("prompt-execution.result.send-via-email-flowmate")}</span>
              </button>
            </li>
          {/if}
        {/if}
        <li>
          <button
            onclick={() => {
              copyTextToClipboardAction?.();
              closeDropdown();
            }}
          >
            <span>{t("prompt-execution.result.copy-text")}</span>
          </button>
        </li>
        <li>
          <button
            onclick={() => {
              copyHtmlToClipboardAction?.();
              closeDropdown();
            }}
          >
            <span>{t("prompt-execution.result.copy-html")}</span>
          </button>
        </li>
      </ul>
    </div>
  {/if}
</div>
