<script lang="ts">
  interface RadioOption {
    value: string;
    label: string;
  }
  interface Props {
    options?: RadioOption[];
    value?: string;
    label?: string;
  }

  let {
    label = "",
    value = $bindable("medium"),
    options = [],
  }: Props = $props();
</script>

<div class="w-full">
  <div class="mb-2 text-base-content font-medium text-sm">{label}</div>
  <div class="flex flex-row space-x-4">
    {#each options as option}
      <div class="form-control">
        <label class="label cursor-pointer">
          <input
            type="radio"
            name="radio-options"
            class="radio radio-primary"
            value={option.value}
            bind:group={value}
          />
          <span class="label-text">{option.label}</span>
        </label>
      </div>
    {/each}
  </div>
</div>
