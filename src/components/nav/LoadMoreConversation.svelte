<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  const t = useTranslations();
  interface Props {
    text?: string;
  }

  let { text = t("conversation.show-more") }: Props = $props();

  async function loadMore() {
    const myAiboxConversationDialog = document.getElementById(
      "my-ai-box-conversation-dialog",
    );
    if (myAiboxConversationDialog) {
      (myAiboxConversationDialog as HTMLDialogElement).show();
    }
  }
</script>

<button class="flex hover:underline px-3 mt-2 link-primary" onclick={loadMore}>
  <span class="font-semibold flex justify-between mr-2">{text}</span>
  {@html svgIcons.longArrowRight}
</button>
