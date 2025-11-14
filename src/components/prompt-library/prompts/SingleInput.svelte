<script lang="ts">
  import { svgIcons } from "$assets/icons";
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
    disabled?: boolean;
  }

  let {
    title,
    placeholder,
    items,
    selectedItem = $bindable(),
    displayTop = false,
    titleClasses = "",
    labelClasses = "",
    disabled = false,
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
    class="{`dropdown ${displayTop ? 'dropdown-top' : 'dropdown-bottom'}`}  w-full min-w-xs"
  >
    <label
      class="input input-bordered flex items-center gap-2 w-full {labelClasses} {disabled
        ? 'pointer-events-none opacity-50 bg-gray-200'
        : ''}"
    >
      <input
        type="text"
        {placeholder}
        bind:value={inputValue}
        role="button"
        class="font-medium w-full min-w-xs"
        readonly
      />
      {@html svgIcons.dropdownArrowDown}
    </label>

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
              {disabled}
              >{typeof item === "string" ? item : item.title}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
