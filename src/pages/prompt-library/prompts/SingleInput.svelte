<script>
  export let title;
  export let placeholder;
  export let items;
  export let selectedItem = "";
  export let onUpdate;

  function handleSelectedItems(event) {
    const currentSelected = event.target.innerText;
    if (selectedItem == currentSelected) {
      selectedItem = "";
    } else {
      selectedItem = currentSelected;
    }
    onUpdate(selectedItem);
  }
</script>

<div>
  <p class="mb-2">{title}</p>
  <div class="dropdown dropdown-bottom w-full min-w-xs">
    <input
      {placeholder}
      value={selectedItem}
      tabindex="30"
      role="button"
      class="input input-bordered font-medium w-full min-w-xs"
      readonly
    />
    <ul
      tabindex="30"
      class="dropdown-content menu bg-base-100 space-y-2 rounded-box z-[1] w-52 p-2 shadow"
    >
      {#each items as item}
        <li on:click={handleSelectedItems}>
          <a
            class={`${selectedItem == item ? "bg-primary text-base-100 hover:bg-primary" : "hover:text-neutral"}`}
            >{item}
          </a>
        </li>
      {/each}
    </ul>
  </div>
</div>
