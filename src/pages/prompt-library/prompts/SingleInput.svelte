<script lang="ts">
  import { clickOutside } from "$components/actions/ClickOutside.svelte";
  type Item = { title: string } | string;

  export let title;
  export let placeholder;
  export let items: Item[];
  export let selectedItem: Item | undefined;
  let isShowDropdownOption = false;
  let inputValue = "";

  $: {
    if (selectedItem) {
      setInputValue();
    } else if (items) {
      resetSelection();
    }
  }

  const resetSelection = () => {
    selectedItem = undefined;
    setInputValue();
  };

  function handleSelectedItems(selected: Item) {
    if (selectedItem === selected) {
      resetSelection();
    } else {
      selectedItem = selected;
      setInputValue();
    }
  }

  function setInputValue() {
    inputValue =
      (selectedItem &&
        (typeof selectedItem === "string"
          ? selectedItem
          : selectedItem.title)) ||
      "";
  }
</script>

<div>
  <p class="mb-2">{title}</p>
  <div
    use:clickOutside
    on:clickoutside={() => {
      isShowDropdownOption = false;
    }}
    class="dropdown dropdown-bottom w-full min-w-xs"
  >
    <input
      {placeholder}
      bind:value={inputValue}
      role="button"
      class="input input-bordered font-medium w-full min-w-xs"
      readonly
      on:click={() => {
        isShowDropdownOption = true;
      }}
    />
    {#if items}
      {#if isShowDropdownOption}
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <ul
          class="dropdown-content menu bg-base-100 space-y-2 rounded-box z-[1] w-52 p-2 shadow"
        >
          {#each items as item}
            <li>
              <button
                on:click|preventDefault={() => handleSelectedItems(item)}
                class={`${selectedItem == item ? "bg-primary text-base-100 hover:bg-primary" : "hover:text-neutral"}`}
                >{typeof item === "string" ? item : item.title}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </div>
</div>
