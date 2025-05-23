<script lang="ts">
  import { preventDefault } from "$utils/common";
  type Item = { title: string } | string;

  interface Props {
    title: any;
    placeholder: any;
    items: Item[];
    selectedItem: Item | undefined;
    displayTop?: boolean;
    titleClasses?: string;
    labelClasses?: string;
  }

  let {
    title,
    placeholder,
    items,
    selectedItem = $bindable(),
    displayTop = false,
    titleClasses = "",
    labelClasses = "",
  }: Props = $props();

  let inputValue = $state("");

  const resetSelection = () => {
    selectedItem = undefined;
    setInputValue();
  };

  function handleSelectedItems(selected: Item) {
    const elem = document.activeElement;
    if (elem) {
      (elem as HTMLElement)?.blur();
    }
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

  $effect(() => {
    if (selectedItem) {
      setInputValue();
    } else if (items) {
      resetSelection();
    }
  });
</script>

<div>
  <p class={"mb-2 " + titleClasses}>{title}</p>
  <div
    class={`dropdown ${displayTop ? "dropdown-top" : "dropdown-bottom"} w-full min-w-xs`}
  >
    <label
      class={"input input-bordered flex items-center gap-2 w-full " +
        labelClasses}
    >
      <input
        type="text"
        {placeholder}
        bind:value={inputValue}
        role="button"
        class="font-medium w-full min-w-xs"
        readonly
      />
      <svg
        width="12"
        height="7"
        viewBox="0 0 12 7"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10.6663 1L5.99967 5.66667L1.33301 1"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </label>
    <!-- class="dropdown-content menu bg-base-100 space-y-2 rounded-box z-1 w-52 p-2 shadow-sm max-h-52 overflow-y-auto" -->
    {#if items}
      <ul
        tabindex="-1"
        class="dropdown-content menu bg-base-100 space-y-2 rounded-box z-1 w-52 p-2 shadow-sm max-h-min overflow-y-auto"
      >
        {#each items as item}
          <li>
            <button
              onclick={preventDefault(() => handleSelectedItems(item))}
              class={`${(typeof selectedItem === "string" ? selectedItem : selectedItem?.title) === (typeof item === "string" ? item : item.title) ? "bg-primary text-primary-content hover:bg-primary" : "hover:text-neutral"}`}
              >{typeof item === "string" ? item : item.title}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
