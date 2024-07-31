<script lang="ts">
  type Item = { title: string } | string;

  export let title;
  export let placeholder;
  export let items: Item[];
  export let selectedItem: Item | undefined;

  let selectedItemTitle = "";

  function handleSelectedItems(selected: Item) {
    if (selectedItem === selected) {
      selectedItem = undefined;
      selectedItemTitle = "";
    } else {
      selectedItem = selected;

      selectedItemTitle =
        typeof selected === "string" ? selected : selected.title;
    }
  }
</script>

<div>
  <p class="mb-2">{title}</p>
  <div class="dropdown dropdown-bottom w-full min-w-xs">
    <input
      {placeholder}
      value={selectedItemTitle}
      tabindex="30"
      role="button"
      class="input input-bordered font-medium w-full min-w-xs"
      readonly
    />
    <ul
      tabindex="30"
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
