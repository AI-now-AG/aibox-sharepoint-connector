<script lang="ts" module>
  export interface ItemOption {
    value: string;
    title: string;
  }
</script>

<script lang="ts">
  import { preventDefault } from "$utils/common";
  import { AudioOptionId, AudioOptionLabels } from "$types/Subscription";

  interface Props {
    title: string;
    placeholder?: string;
    value: string[];
  }

  let { title, placeholder, value = $bindable() }: Props = $props();

  const items: ItemOption[] = [
    { value: AudioOptionId.AudioBasis, title: AudioOptionLabels.AudioBasis },
    {
      value: AudioOptionId.AudioBasisAddOnSubtitle,
      title: AudioOptionLabels.AudioBasisAddOnSubtitle,
    },
    {
      value: AudioOptionId.AudioBasisAddOnLarge,
      title: AudioOptionLabels.AudioBasisAddOnLarge,
    },
    {
      value: AudioOptionId.AudioPremium,
      title: AudioOptionLabels.AudioPremium,
    },
  ];

  let selectedItems: ItemOption[] = $state([]);
  let inputValue = $state("");
  let initialized = false;

  // Derived state for easier logic
  const isSelected = (val: string) =>
    selectedItems.some((i) => i.value === val);
  const getItemByValue = (val: string) => items.find((i) => i.value === val);

  // One-time sync from external value
  $effect(() => {
    if (!initialized && value?.length) {
      selectedItems = items.filter((item) => value.includes(item.value));
      initialized = true;
    }
  });

  // Update external value + input field
  $effect(() => {
    value = selectedItems.map((e) => e.value);
    inputValue = selectedItems.map((e) => e.title).join(", ");
  });

  function toggleSelection(item: ItemOption) {
    const exists = isSelected(item.value);

    // Handle special logic:
    if (item.value === AudioOptionId.AudioBasis) {
      // Toggle AudioBasis
      if (exists) {
        selectedItems = selectedItems.filter((i) => i.value !== item.value);
      } else {
        selectedItems = selectedItems
          .filter((i) => i.value !== AudioOptionId.AudioPremium) // Remove AudioPremium
          .concat(item);
      }
    } else if (item.value === AudioOptionId.AudioPremium) {
      if (exists) {
        selectedItems = selectedItems.filter((i) => i.value !== item.value);
      } else {
        selectedItems = selectedItems
          .filter(
            (i: any) =>
              ![
                AudioOptionId.AudioBasis,
                AudioOptionId.AudioBasisAddOnLarge,
                AudioOptionId.AudioBasisAddOnSubtitle,
              ].includes(i.value),
          )
          .concat(item);
      }
    } else if (
      item.value === AudioOptionId.AudioBasisAddOnSubtitle ||
      item.value === AudioOptionId.AudioBasisAddOnLarge
    ) {
      if (!isSelected(AudioOptionId.AudioBasis)) return; // Prevent selection if AudioBasis not selected

      selectedItems = exists
        ? selectedItems.filter((i) => i.value !== item.value)
        : [...selectedItems, item];
    } else {
      // Normal toggle
      selectedItems = exists
        ? selectedItems.filter((i) => i.value !== item.value)
        : [...selectedItems, item];
    }
  }
</script>

<div>
  <p class="mb-2">{title}</p>
  <div class="dropdown dropdown-bottom w-full min-w-xs">
    <label class="input input-bordered flex items-center gap-2 w-full">
      <input
        type="text"
        placeholder={placeholder ?? "Select options..."}
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

    {#if items}
      <ul
        tabindex="-1"
        class="dropdown-content menu bg-base-100 space-y-2 rounded-box z-1 w-52 p-2 shadow-sm"
      >
        {#each items as item}
          <li>
            <button
              disabled={(item.value === AudioOptionId.AudioBasisAddOnSubtitle ||
                item.value === AudioOptionId.AudioBasisAddOnLarge) &&
                !isSelected(AudioOptionId.AudioBasis)}
              onclick={preventDefault(() => toggleSelection(item))}
              class={`${
                isSelected(item.value)
                  ? "bg-primary text-primary-content hover:bg-primary"
                  : "hover:text-neutral"
              } ${
                (item.value === AudioOptionId.AudioBasisAddOnSubtitle ||
                  item.value === AudioOptionId.AudioBasisAddOnLarge) &&
                !isSelected(AudioOptionId.AudioBasis)
                  ? "opacity-50 pointer-events-none"
                  : ""
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
