<script lang="ts">
  import { svgIcons } from "$assets/icons";

  type KBType = "none" | "basic" | "advanced";

  interface Props {
    type: KBType;
    title: string;
    description: string;
    selected: KBType;
    disabled?: boolean;
  }

  let {
    type,
    title,
    description,
    selected = $bindable(),
    disabled = false,
  }: Props = $props();

  let isSelected = $derived(selected === type);

  function getIcon(kbType: KBType): string {
    switch (kbType) {
      case "none":
        return svgIcons.block;
      case "basic":
        return svgIcons.document;
      case "advanced":
        return svgIcons.aitool;
      default:
        return svgIcons.document;
    }
  }

  function handleClick() {
    if (!disabled) {
      selected = type;
    }
  }
</script>

<div class="tooltip tooltip-top flex-1 min-w-[120px]">
  <!-- Custom tooltip content -->
  <div class="tooltip-content bg-transparent border-none p-0!">
    <div class="card bg-base-100 shadow-lg rounded-lg w-64 border border-base-200">
      <div class="card-body p-4">
        <h3 class="text-sm font-medium text-primary">{title}</h3>
        <p class="text-sm text-base-content/60 mt-1">{description}</p>
      </div>
    </div>
  </div>

  <button
    class="card bg-base-100 border border-base-300 rounded-lg px-3 py-2.5 cursor-pointer transition-all hover:shadow-sm w-full
           {isSelected ? 'border-primary bg-primary/5' : ''}
           {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
    onclick={handleClick}
    {disabled}
    type="button"
  >
    <div class="flex items-center gap-3">
      <!-- Icon -->
      <div
        class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
               {isSelected ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/60'}"
      >
        {@html getIcon(type)}
      </div>

      <!-- Content -->
      <div class="flex-1 text-left min-w-0">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-medium">{title}</span>
          <input
            type="radio"
            name="kb-type"
            class="radio radio-primary radio-sm shrink-0"
            checked={isSelected}
            {disabled}
            onchange={handleClick}
          />
        </div>
      </div>
    </div>
  </button>
</div>
