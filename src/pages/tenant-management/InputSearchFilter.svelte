<script lang="ts">
  import { createBubbler, handlers } from "svelte/legacy";

  const bubble = createBubbler();
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  interface Props {
    value?: string;
    showArchived?: boolean;
    search?: any;
    filter?: any;
  }

  let {
    value = $bindable(""),
    showArchived = $bindable(false),
    search,
    filter,
  }: Props = $props();
  let typingTimeout: any;

  const onSearch = ({ target }: any) => {
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      value = target.value;
      search();
      console.log("dispatch search", { value });
    }, 300);
  };

  const onFilter = ({ target }: any) => {
    showArchived = !showArchived;
    setTimeout(() => (target.checked = showArchived), 0);
    filter();
    console.log("dispatch filter", { value });
  };

  function preventDefault(fn) {
    return function (event) {
      event.preventDefault();
      fn.call(this, event);
    };
  }
</script>

<div class="items-center mb-10">
  <div class="relative w-full">
    <label class="input input-bordered flex items-center gap-2">
      {@html svgIcons.search}
      <input
        type="text"
        class="grow text-sm"
        placeholder={t("tenant.tenants.seach-place-holder")}
        oninput={handlers(onSearch, bubble("input"))}
        onblur={bubble("blur")}
      />
    </label>
  </div>
  <div class="mt-4">
    <label class="flex items-center space-x-2">
      <input
        type="checkbox"
        class="checkbox border-gray-300 rounded focus:ring-indigo-500 w-5 h-5"
        checked={showArchived}
        onclick={preventDefault(onFilter)}
      />
      <span class="label-text">{t("tenant.tenants.show-archived")}</span>
    </label>
  </div>
</div>
