<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { preventDefault } from "$utils/common";
  type Item = { title: string; value: string };

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

  const setTheme = (item: Item) => {
    const elem = document.activeElement;
    if (elem instanceof HTMLElement) {
      elem.blur();
    }
    document.documentElement.setAttribute("data-theme", item.value);
    handleSelectedItems(item);
  };
</script>

<div>
  <p class="mb-2">{title}</p>
  <div class="dropdown dropdown-bottom w-full">
    <label class="input input-bordered flex items-center gap-2 w-full">
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
        class="dropdown-content list bg-base-100 space-y-2 rounded-box z-1 shadow-md max-h-52 overflow-y-auto w-full"
      >
        {#each items as item}
          <li class="list p-2 rounded-md" data-theme={item.value}>
            <button
              class="border-base-content/20 hover:border-base-content/40 overflow-hidden rounded-lg border outline-2 outline-offset-2 outline-transparent"
              onclick={preventDefault(() => setTheme(item))}
            >
              <div
                class="flex-1 bg-base-100 text-base-content w-full cursor-pointer font-sans"
                data-theme={typeof item === "string" ? item : item.value}
              >
                <div class="flex flex-row">
                  <div class="flex flex-col">
                    <div
                      class="w-12 h-6 bg-base-200 col-start-1 row-span-2 row-start-1"
                    ></div>
                    <div
                      class="w-12 h-6 bg-base-300 col-start-1 row-start-3"
                    ></div>
                  </div>
                  <div
                    class="bg-base-100 col-span-4 col-start-2 row-span-3 row-start-1 flex flex-col gap-1 p-2"
                  >
                    <div class="flex flex-col space-y-2">
                      <div class="font-bold">
                        {typeof item === "string" ? item : item.title}
                      </div>
                      <div class="flex flex-col">
                        <div class="flex flex-wrap gap-1">
                          <div
                            class="bg-primary flex aspect-square w-5 items-center justify-center rounded lg:w-6"
                          >
                            <div class="text-primary-content text-sm font-bold">
                              A
                            </div>
                          </div>
                          <div
                            class="bg-secondary flex aspect-square w-5 items-center justify-center rounded lg:w-6"
                          >
                            <div
                              class="text-secondary-content text-sm font-bold"
                            >
                              A
                            </div>
                          </div>
                          <div
                            class="bg-accent flex aspect-square w-5 items-center justify-center rounded lg:w-6"
                          >
                            <div class="text-accent-content text-sm font-bold">
                              A
                            </div>
                          </div>
                          <div
                            class="bg-neutral flex aspect-square w-5 items-center justify-center rounded lg:w-6"
                          >
                            <div class="text-neutral-content text-sm font-bold">
                              A
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
