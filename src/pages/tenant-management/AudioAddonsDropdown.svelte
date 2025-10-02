<script lang="ts" module>
  export interface ItemOption {
    value: string;
    title: string;
  }
</script>

<script lang="ts">
  import { preventDefault } from "$utils/common";
  import { AudioOptionId, AudioOptionLabels } from "$types/Subscription";
  import { svgIcons } from "$assets/icons";

  interface Props {
    title: string;
    placeholder?: string;
    value: string[];
    type: "audiototext" | "subtitlestudio";
  }

  let {
    title,
    placeholder,
    value = $bindable(),
    type = "audiototext",
  }: Props = $props();

  const items: ItemOption[] =
    type == "audiototext"
      ? [
          {
            value: AudioOptionId.AudioBasis,
            title: AudioOptionLabels.AudioBasis,
          },
          {
            value: AudioOptionId.AudioBasisAddOnLarge,
            title: AudioOptionLabels.AudioBasisAddOnLarge,
          },
        ]
      : [
          {
            value: AudioOptionId.AudioBasisAddOnSubtitle,
            title: AudioOptionLabels.AudioBasisAddOnSubtitle,
          },
          {
            value: AudioOptionId.AudioPremium,
            title: AudioOptionLabels.AudioPremium,
          },
        ];

  // Internal state for single selection
  let selectedItem: ItemOption | undefined = $state(undefined);
  let inputValue = $state("");
  let initialized = false;

  // Derived state
  const isSelected = (val: string) => selectedItem?.value === val;

  // --- Effect 1: Sync from external value (string[]) to internal state (single item)
  $effect(() => {
    if (!initialized && value?.length) {
      // Find the first item in the external value array and set it as the single selected item
      selectedItem = items.find((item) => item.value === value[0]);
      initialized = true;
    }
  });

  // --- Effect 2: Sync from internal state (single item) to external value (string[]) and input field
  $effect(() => {
    // If an item is selected, the external value array contains only that item's value.
    if (selectedItem) {
      value = [selectedItem.value];
      inputValue = selectedItem.title;
    } else {
      // If nothing is selected, the external value array is empty.
      value = [];
      inputValue = "";
    }
  });

  /**
   * Handles selection, enforcing single-select logic.
   * Updates the internal 'selectedItem' state.
   */
  function selectItem(item: ItemOption) {
    // If the clicked item is already selected, deselect it (set to undefined).
    if (selectedItem?.value === item.value) {
      selectedItem = undefined;
    } else {
      // Otherwise, select the new item, replacing any previous selection.
      selectedItem = item;
    }
  }
</script>

<div>
  <p class="mb-2">{title}</p>
  <div class="dropdown dropdown-bottom w-full min-w-xs">
    <label class="input input-bordered flex items-center gap-2 w-full">
      <input
        type="text"
        placeholder={placeholder ?? "Select option..."}
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
        class="dropdown-content menu bg-base-100 space-y-2 rounded-box z-1 w-52 p-2 shadow-sm"
      >
        {#each items as item}
          <li>
            <button
              disabled={false}
              onclick={preventDefault(() => selectItem(item))}
              class={`${
                isSelected(item.value)
                  ? "bg-primary text-primary-content hover:bg-primary"
                  : "hover:text-neutral"
              }`}
            >
              {item.title}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
