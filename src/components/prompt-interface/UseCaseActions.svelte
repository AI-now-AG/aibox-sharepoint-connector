<script lang="ts">
  import { onMount } from "svelte";
  import DropdownSection from "$components/DropdownSection.svelte";
  import { type Option } from "$components/DropdownOptions.svelte";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { tenant } from "$stores";

  const t = useTranslations();

  interface Props {
    active: boolean;
    isEditable: boolean;
    data: any;
    zIndex?: number;
    onSelectCart: (data: any) => void;
    onSelectEdit?: Function;
    onSelectDuplicate?: Function;
    onSelectReorder?: Function;
    onSelectDelete?: Function;
  }

  let {
    active,
    isEditable,
    data,
    zIndex = 1,
    onSelectCart,
    onSelectEdit,
    onSelectDuplicate,
    onSelectReorder,
    onSelectDelete,
  }: Props = $props();

  let options: Option[] = [
    {
      icon: svgIcons.edit,
      text: t("common.edit"),
      action: () => {
        onSelectEdit?.();
      },
    },
    {
      icon: svgIcons.duplicate,
      text: t("common.duplicate"),
      action: () => {
        onSelectDuplicate?.();
      },
    },
    {
      icon: svgIcons.reorder,
      text: t("common.change-order"),
      action: () => {
        onSelectReorder?.();
      },
    },
    {
      icon: svgIcons.trash,
      text: t("common.delete"),
      action: () => {
        onSelectDelete?.();
      },
    },
  ];

  let activeModels: any = $state("");

  onMount(async function () {
    activeModels = getActiveModels();
  });

  const getActiveModels = (): any[] => {
    const getModelLabel = (provider: any) => {
      const key = `${provider.name}_chat_model` as keyof typeof $tenant;
      const model = $tenant?.[key] || "gpt-4o";
      return model;
    };
    const aiProviders = $tenant?.api_key_providers ?? [];
    const models: any[] =
      aiProviders
        .filter((provider: any) => provider.active)
        .map((provider: any) => {
          return {
            provider: provider.name,
            modelName: getModelLabel(provider),
          };
        }) || [];
    return models;
  };

  const getModelName = (model: string) => {
    for (let i = 0; i < activeModels.length; i++) {
      const modelItem = activeModels[i];
      if (model?.includes(modelItem?.provider)) {
        return modelItem.modelName;
      }
    }
    return t("tenant.default").toLowerCase();
  };
</script>

{#if options.length >= 1}
  <button
    class={`relative btn w-full rounded-xl h-auto p-6 ${active ? "btn-primary " : "btn-outline border-1 border-base-content/30"} flex`}
    onclick={() => {
      onSelectCart?.(data);
    }}
    style={`z-index: ${zIndex};`}
  >
    <span
      class="absolute top-2 left-2 px-2 py-[1px] bg-white border-1 border-base-content/30 rounded-lg text-xs text-black font-medium"
    >
      {getModelName(data?.model)}
    </span>

    {#if isEditable}
      <DropdownSection class={"absolute top-1 right-1"} {options} />
    {/if}
    <p class="card-title text-sm font-normal mt-4">{data?.title ?? ""}</p>
  </button>
{/if}
