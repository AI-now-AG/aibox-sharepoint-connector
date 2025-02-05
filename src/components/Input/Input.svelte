<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";

  interface Props {
    id?: string;
    label?: string;
    value?: string;
    placeholder?: string;
    classes?: string;
    disabled?: boolean;
    icon?: string | null;
    type?: HTMLInputAttributes["type"];
    required?: boolean;
  }

  let {
    id = "",
    label = "",
    value = "",
    placeholder = "",
    classes = "",
    disabled = false,
    icon = null,
    type = "text",
    required = false
  }: Props = $props();

  const dispatch = createEventDispatcher();

  function handleChange(event: Event) {
    dispatch("inputChange", { value: event.target?.value });
  }
</script>

<div class="form-control">
  <label for={id} class="label pl-0 pb-3">
    <span class="label-text text-base-content/40">{label}</span>
  </label>
  <div
    class="input input-bordered flex justify-between items-center gap-2 p-4"
    style={disabled ? "border: 1px solid #E5E6E6; color: #0F172A" : ""}
  >
    <input
      {id}
      {placeholder}
      {disabled}
      {type}
      {required}
      {value}
      name={id}
      class={`w-full ${classes}`}
      oninput={handleChange}
    />
    {#if icon}
      {@html icon}
    {/if}
  </div>
</div>
