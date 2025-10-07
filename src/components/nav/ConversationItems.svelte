<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";
  import { DialogId } from "$types/UiDialog";
  import { wildcardMatch } from "$utils/wildcardMatch";
  const t = useTranslations();

  type MenuItem = {
    title: string;
    path: string;
    icon?: string;
  };

  interface Props {
    conversations: any;
    routePath: string;
    isCollapsed?: boolean;
  }

  let { conversations = [], routePath, isCollapsed = false }: Props = $props();
  let items: MenuItem[] = $state([]);

  onMount(() => {
    items = mapConversationsToItems(conversations);

    const handler = () => refreshItems();
    window.addEventListener("reload-sidebar", handler);

    return () => {
      window.removeEventListener("reload-sidebar", handler);
    };
  });

  function mapConversationsToItems(conversations: any[]): MenuItem[] {
    return conversations.map((conversation: any) => ({
      title: conversation.title,
      path: `/conversations/${conversation._id}`,
    }));
  }

  async function refreshItems() {
    const { data, error } = await actions.conversation.list({
      limit: 5,
    });
    if (error) {
      addToast({
        message: error?.message ?? "Something went wrong",
        type: "error",
      });
    } else {
      items = mapConversationsToItems(data);
    }
  }

  function showConversationDialog() {
    const dialog = document.getElementById(DialogId.MyAiboxConversation);
    if (dialog instanceof HTMLDialogElement) {
      dialog.show();
    }
  }
</script>

{#if items.length > 0}
  <ul
    class={`active:bg-transparent w-full pr-4 ${isCollapsed ? "hidden" : ""}`}
  >
    {#each items as item}
      <li class="pl-1 active:bg-transparent w-full">
        <a
          class="font-semibold flex justify-between w-full {item.path ===
            routePath || wildcardMatch(routePath, `${item.path}`)
            ? 'menu-active'
            : ''}"
          href={item.path}
          ><span class="inline-block w-full truncate">{item.title}</span></a
        >
      </li>
    {/each}
    {#if items.length > 0}
      <li class="pl-1 active:bg-transparent w-full">
        <button
          class="flex hover:underline px-3 mt-2 link-primary"
          onclick={showConversationDialog}
        >
          <span class="font-semibold flex justify-between mr-2"
            >{t("conversation.show-more")}</span
          >
          {@html svgIcons.longArrowRight}
        </button>
      </li>
    {/if}
  </ul>
{/if}
