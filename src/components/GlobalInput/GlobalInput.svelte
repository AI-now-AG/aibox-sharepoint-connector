<script lang="ts">
  import { ErrorMessage, Field } from "svelte-forms-lib";
  import type { HTMLInputAttributes } from "svelte/elements";

  export let id: string = "";
  export let label: string = "";
  export let value: string = "";
  export let type: HTMLInputAttributes["type"] = "text";
  export let placeholder: string = "";
  export let classes: string = "";
  export let disabled: boolean = false;
  export let icon: string | null = null;
  export let onChange: (event: unknown) => void = () => {};
</script>

<div class="form-control">
  <label for={id} class="label pl-0 pb-3">
    <span class="label-text text-gray-500">{label}</span>
  </label>
  <div
    class="input input-bordered flex justify-between items-center gap-2 p-4"
    style={disabled ? "border: 1px solid #E5E6E6; color: #0F172A" : ""}
  >
    <Field
      {id}
      {placeholder}
      {disabled}
      {type}
      name={id}
      class={`w-full ${classes}`}
      bind:value
      on:change={onChange}
    />
    {#if icon}
      {@html icon}
    {/if}
  </div>
  <ErrorMessage name={id} />
</div>
