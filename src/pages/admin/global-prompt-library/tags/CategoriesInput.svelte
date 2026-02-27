<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { preventDefault } from "$utils/common";

  interface Props {
    items: string[];
    selectedItems: string[];
    onchange: Function;
    placeholder?: string;
  }

  let {
    items = $bindable([]),
    selectedItems = $bindable([]),
    onchange,
    placeholder,
  }: Props = $props();

  let inputValue = $state("");

  $effect(() => {
    if (selectedItems.length > 0) {
      setInputValue();
    } else if (items) {
      resetSelection();
    }
  });

  $effect(() => {
    inputValue = selectedItems?.join(", ");
  });

  const addOrRemoveInputType = (array: string[], item: string) => {
    console.log("array", array);
    return array.includes(item)
      ? array.filter((c) => c !== item)
      : [...array, item];
  };

  const resetSelection = () => {
    if (selectedItems.length !== 0) {
      selectedItems = [];
      setInputValue();
    }
  };

  function handleSelectedItems(selected: string) {
    selectedItems = [...addOrRemoveInputType(selectedItems!, selected)];
    setInputValue();
    onchange?.();
  }

  function setInputValue() {
    inputValue = selectedItems.join(", ");
  }
</script>

<div class="dropdown dropdown-bottom w-full">
  <label class="input input-bordered flex items-center gap-2 w-full">
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="mr-2"
    >
      <path
        d="M13 13L9 9M10.3333 5.66667C10.3333 8.244 8.244 10.3333 5.66667 10.3333C3.08934 10.3333 1 8.244 1 5.66667C1 3.08934 3.08934 1 5.66667 1C8.244 1 10.3333 3.08934 10.3333 5.66667Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <input
      type="text"
      {placeholder}
      bind:value={inputValue}
      role="button"
      class="font-medium w-full"
      readonly
    />
    {@html svgIcons.dropdownArrowDown}
  </label>
  {#if items}
    <ul
      tabindex="-1"
      class="dropdown-content menu bg-base-100 space-y-2 rounded-box z-1 w-52 p-2 shadow-sm"
    >
      {#each items as value}
        <li>
          <button
            onclick={preventDefault(() => handleSelectedItems(value))}
            class={`${selectedItems?.includes(value) ? "bg-primary text-primary-content hover:bg-primary" : "hover:text-neutral"}`}
          >
            {value}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
