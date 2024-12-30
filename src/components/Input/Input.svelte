<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";

  export let id: string = "";
  export let label: string = "";
  export let value: string = "";
  export let placeholder: string = "";
  export let classes: string = "";
  export let disabled: boolean = false;
  export let icon: string | null = null;
  export let type: HTMLInputAttributes["type"] = "text";
  export let required: boolean = false;

  const dispatch = createEventDispatcher();

  function handleChange(event: Event) {
    dispatch("inputChange", { value: event.target?.value });
  }
</script>

<div class="form-control">
  <label for={id} class="label pl-0 pb-3">
    <span class="label-text text-gray-400 font-medium">{label}</span>
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
      on:input={handleChange}
    />
    {#if icon}
      {@html icon}
    {/if}
  </div>
</div>
