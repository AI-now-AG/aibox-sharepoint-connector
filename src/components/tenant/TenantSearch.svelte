<script lang="ts" module>
  export interface Option {
    value: string;
    title: string;
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
    selectedTenant: string | null;
    onselect?: Function;
    onclear?: Function;
  }
  let { selectedTenant = $bindable(""), onselect, onclear }: Props = $props();

  const t = useTranslations();

  let options: Option[] = $state([]);
  let isFetching: boolean = $state(false);

  let searchQuery: string = $state("");
  let filteredTenants: Option[] = $state([]);
  let selectedOption: Option | null = $state(null);

  onMount(() => {
    fetchTenants();
  });

  async function fetchTenants() {
    isFetching = true;

    const { data } = await actions.tenant.listActive();
    options = data.map((tenant: any) => ({
      value: tenant._id,
      title: tenant.name,
    }));

    isFetching = false;
  }

  function filterTenants() {
    filteredTenants = options.filter((option) => {
      return option.title?.toLowerCase()?.includes(searchQuery?.toLowerCase());
    });
  }

  const onSearch = debounce(() => {
    filterTenants();
  }, 300);

  function onClear() {
    searchQuery = "";
    selectedOption = null;
    selectedTenant = null;

    onclear?.();
  }

  function onSelect(option: Option) {
    selectedOption = option;
    selectedTenant = option.value;

    searchQuery = option.title;
    filteredTenants = [];

    onselect?.(selectedTenant);
  }
</script>

<div class="dropdown w-full">
  <div class="flex flex-row items-center space-x-2">
    <div class="input flex justify-between items-center gap-2">
      {@html svgIcons.search}
      <input
        type="text"
        class="grow
        {selectedOption ? 'bg-base-100' : ''} 
        {isFetching ? ' pointer-events-none opacity-50 bg-gray-200 ' : ' '}"
        placeholder={selectedOption ? selectedOption.title : "Search tenants"}
        bind:value={searchQuery}
        oninput={preventDefault(onSearch)}
      />
      {#if searchQuery?.length > 0}
        <button onclick={onClear}>
          {@html svgIcons.close}
        </button>
      {/if}
    </div>
  </div>

  {#if filteredTenants.length > 0}
    <ul
      class="dropdown-content menu shadow bg-base-100 rounded-box w-full max-h-[250px] overflow-scroll"
      out:fade
    >
      {#each filteredTenants as option}
        <li>
          <button
            onclick={() => {
              onSelect(option);
            }}>{option.title}</button
          >
        </li>
      {/each}
    </ul>
  {/if}
</div>
