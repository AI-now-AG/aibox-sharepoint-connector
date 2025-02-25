<script lang="ts">
    import { preventDefault } from "$utils/common";
    type Item = { title: string } | string;
  
    interface Props {
      title: any;
      placeholder: any;
      items: Item[];
      selectedItem: Item | undefined;
    }
  
    let {
      title,
      placeholder,
      items,
      selectedItem = $bindable(),
    }: Props = $props();
  
    let inputValue = $state("");
  
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
    $effect(() => {
      if (selectedItem) {
        setInputValue();
      } else if (items) {
        resetSelection();
      }
    });
  </script>
  
  <div>
    <p class="mb-2 text-base-content/50 font-medium text-sm">{title}</p>
    <div class="dropdown dropdown-top w-full min-w-xs">
      <input
        {placeholder}
        bind:value={inputValue}
        role="button"
        class="input input-bordered font-medium w-full min-w-xs"
        readonly
      />
      {#if items}
        <ul
          tabindex="-1"
          class="dropdown-content menu bg-base-100 space-y-2 rounded-box z-[1] w-52 p-2 shadow"
        >
          {#each items as item}
            <li>
              <button
                onclick={preventDefault(() => handleSelectedItems(item))}
                class={`${selectedItem == item ? "bg-primary text-base-100 hover:bg-primary" : "hover:text-neutral"}`}
                >{typeof item === "string" ? item : item.title}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
  