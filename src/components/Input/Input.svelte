<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  interface Props {
    id?: string;
    label?: string;
    value?: string;
    placeholder?: string;
    classes?: string;
    containerClasses?: string;
    labelClasses?: string;
    disabled?: boolean;
    icon?: string | null;
    type?: HTMLInputAttributes["type"];
    required?: boolean;
    inputChange?: any;
  }

  let {
    id = "",
    label = "",
    value = "",
    placeholder = "",
    classes = "",
    containerClasses = "",
    labelClasses = "",
    disabled = false,
    icon = null,
    type = "text",
    required = false,
    inputChange,
  }: Props = $props();

  function handleChange(event: Event) {
    inputChange({ value: (event.target as HTMLInputElement)?.value });
  }
</script>

<div class="form-control">
  <label for={id} class="label pl-0 pb-3">
    <span class={"label-text text-base-content" + labelClasses}>{label}</span>
  </label>
  <div
    class={"input flex justify-between items-center gap-2 w-full " +
      containerClasses}
    style={disabled ? "border: 1px solid" : ""}
  >
    <input
      {id}
      {placeholder}
      {disabled}
      {type}
      {required}
      {value}
      name={id}
      class={`${classes}`}
      oninput={handleChange}
    />
    {#if icon}
      {@html icon}
    {/if}
  </div>
</div>
