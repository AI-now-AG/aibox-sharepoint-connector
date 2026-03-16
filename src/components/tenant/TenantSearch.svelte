<script lang="ts" module>
  export interface Option {
    value: string;
    title: string;
    active?: boolean;
  }
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { actions } from "astro:actions";
  import { preventDefault, debounce } from "$utils/common";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";

  interface Props {
    selectedTenant: string;
    placeholder?: string;
    disabled?: boolean;
    includeInactive?: boolean;
    onselect?: Function;
    onclear?: Function;
  }
  let {
    selectedTenant = $bindable(""),
    placeholder = "Search tenants",
    disabled = false,
    includeInactive = true,
    onselect,
    onclear,
  }: Props = $props();

  const t = useTranslations();

  let options: Option[] = $state([]);
  let isFetching: boolean = $state(false);

  let searchQuery: string = $state("");
  let filteredTenants: Option[] = $state([]);
  let selectedOption: Option | null = $state(null);

  onMount(() => {
    fetchTenants();
  });

  $effect(() => {
    if (selectedTenant == "") {
      searchQuery = "";
      selectedOption = null;
    }
  });

  async function fetchTenants() {
    isFetching = true;

    const { data } = await actions.tenant.listAll();
    options = data
      .filter((tenant: any) => includeInactive || tenant.active)
      .map((tenant: any) => ({
        value: tenant._id,
        title: tenant.name,
        active: tenant.active,
      }));

    isFetching = false;
  }

  function filterTenants() {
    const query = searchQuery?.toLowerCase() ?? "";

    filteredTenants = options
      .filter((option) => option.title?.toLowerCase().includes(query))
      .sort((a, b) => {
        const score = (t: string) =>
          t === query ? 0 : t.startsWith(query) ? 1 : 2;
        return (
          score(a.title.toLowerCase()) - score(b.title.toLowerCase()) ||
          a.title.localeCompare(b.title)
        );
      })
      .slice(0, 10);
  }

  const onSearch = debounce(() => {
    filterTenants();
  }, 300);

  function onClear() {
    searchQuery = "";
    selectedOption = null;
    selectedTenant = "";

    onclear?.();
  }

  function onSelect(option: Option) {
    selectedOption = option;
    selectedTenant = option.value;

    searchQuery =
      option.active === false ? `${option.title} (inactive)` : option.title;
    filteredTenants = [];

    onselect?.(selectedTenant);
  }
</script>

<div class="dropdown w-full">
  <div class="flex flex-row items-center space-x-2">
    <div
      class="w-full input flex justify-between items-center gap-2 {disabled
        ? 'pointer-events-none opacity-50'
        : ''}"
    >
      {#if isFetching}
        <span class="loading loading-sm loading-dots"></span>
      {:else}
        {@html svgIcons.search}
      {/if}
      <input
        type="text"
        class="grow {selectedOption ? 'bg-base-100 cursor-default' : ''}"
        placeholder={selectedOption ? selectedOption.title : placeholder}
        bind:value={searchQuery}
        readonly={!!selectedOption || isFetching}
        oninput={preventDefault(onSearch)}
      />
      {#if searchQuery?.length > 0}
        <button class="cursor-pointer" onclick={onClear}>
          {@html svgIcons.close}
        </button>
      {/if}
    </div>
  </div>

  {#if filteredTenants.length > 0}
    <ul
      class="dropdown-content menu shadow bg-base-100 rounded-box w-full max-h-[250px] overflow-x-scroll flex-nowrap"
      out:fade
    >
      {#each filteredTenants as option}
        <li class="w-full">
          <button
            class="w-full text-left flex items-center justify-between gap-2"
            onclick={() => {
              onSelect(option);
            }}
          >
            <span>{option.title}</span>
            {#if option.active === false}
              <span class="badge badge-sm badge-warning">inactive</span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
