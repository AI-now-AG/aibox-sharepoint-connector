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

<button
  class="card bg-base-100 border-2 px-3 py-2.5 cursor-pointer transition-all hover:shadow-sm flex-1 min-w-[140px]
         {isSelected ? 'border-primary bg-primary/5' : 'border-base-300'}
         {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
  onclick={handleClick}
  {disabled}
  type="button"
>
  <div class="flex items-start gap-3">
    <!-- Icon -->
    <div
      class="w-8 h-8 rounded-md flex items-center justify-center shrink-0
             {isSelected ? 'bg-primary/20 text-primary' : 'bg-base-200 text-base-content/60'}"
    >
      {@html getIcon(type)}
    </div>

    <!-- Content -->
    <div class="flex-1 text-left min-w-0">
      <div class="flex items-center justify-between gap-2">
        <h5 class="font-semibold text-sm">{title}</h5>
        <input
          type="radio"
          name="kb-type"
          class="radio radio-primary radio-xs shrink-0"
          checked={isSelected}
          {disabled}
          onchange={handleClick}
        />
      </div>
      <p class="text-xs text-base-content/60 mt-0.5 line-clamp-2">
        {description}
      </p>
    </div>
  </div>
</button>

<style>
  button :global(svg) {
    width: 16px;
    height: 16px;
  }
</style>
