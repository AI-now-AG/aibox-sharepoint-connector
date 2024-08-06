<script lang="ts">
  // TODO: Use radio buttons instead of button, it's what they are used for. That
  // way we don't have to manage selected state ourselves.
  type Item = { title: string } | string;

  export let title;
  export let placeholder;
  export let items: Item[];
  export let selectedItem: Item | undefined;

  $: {
    if (items) {
      resetSelection();
    }
  }

  const resetSelection = () => {
    selectedItem = undefined;
  };

  function handleSelectedItems(selected: Item) {
    if (selectedItem === selected) {
      resetSelection();
    } else {
      selectedItem = selected;
    }
  }
</script>

<div>
  <p class="mb-2">{title}</p>
  <div class="dropdown dropdown-bottom w-full min-w-xs">
    <input
      {placeholder}
      value={(selectedItem &&
        (typeof selectedItem === "string"
          ? selectedItem
          : selectedItem.title)) ||
        ""}
      tabindex="2"
      role="button"
      class="input input-bordered font-medium w-full min-w-xs"
      readonly
    />
    <ul
      tabindex="2"
      class="dropdown-content menu bg-base-100 space-y-2 rounded-box z-[1] w-52 p-2 shadow"
    >
      {#if items}
        {#each items as item}
          <li>
            <button
              on:click|preventDefault={() => handleSelectedItems(item)}
              class={`${selectedItem == item ? "bg-primary text-base-100 hover:bg-primary" : "hover:text-neutral"}`}
              >{typeof item === "string" ? item : item.title}
            </button>
          </li>
        {/each}
      {/if}
    </ul>
  </div>
</div>
