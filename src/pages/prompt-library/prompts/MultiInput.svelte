<script lang="ts">
  // TODO: Us checkboxes instead of anchors, it's what they are used for. That
  // way we don't have to manage selected state ourselves.

  type Item = { title: string };
  interface Props {
    title: string;
    placeholder: string;
    items: Item[];
    selectedItems: Item[];
  }

  let {
    title,
    placeholder,
    items = $bindable(),
    selectedItems = $bindable(),
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
    inputValue = selectedItems?.map((e) => e.title).join(", ");
  });

  const addOrRemoveInputType = (array: Item[], item: Item) => {
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

  function handleSelectedItems(selected: Item) {
    selectedItems = [...addOrRemoveInputType(selectedItems!, selected)];
    setInputValue();
  }

  function setInputValue() {
    inputValue = selectedItems?.map((e) => e.title).join(", ");
  }

  function preventDefault(fn) {
    return function (event) {
      event.preventDefault();
      fn.call(this, event);
    };
  }
</script>

<div>
  <p class="mb-2">{title}</p>
  <div class="dropdown dropdown-bottom w-full min-w-xs">
    <label class="input input-bordered flex items-center gap-2">
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
          stroke="#111827"
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
        class="grow font-medium w-full min-w-xs"
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
          stroke="#111827"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </label>
    {#if items}
      <ul
        tabindex="-1"
        class="dropdown-content menu bg-base-100 space-y-2 rounded-box z-[1] w-52 p-2 shadow"
      >
        {#each items as item}
          <li>
            <button
              onclick={preventDefault(() => handleSelectedItems(item))}
              class={`${selectedItems?.includes(item) ? "bg-primary text-base-100 hover:bg-primary" : "hover:text-neutral"}`}
            >
              {item.title}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
