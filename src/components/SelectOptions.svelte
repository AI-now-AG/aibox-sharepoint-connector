<!-- svelte-ignore a11y_label_has_associated_control -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore event_directive_deprecated -->

<script lang="ts" module>
  /*
   const options = [
    { value: "_value", label: "_label" }
  ];
  */
  export interface Option {
    value: string;
    label: string;
  }
</script>

<script lang="ts">
  interface Props {
    options?: Option[];
    label?: string;
    value?: string;
    placeholder?: string;
    classes?: string;
    children?: import("svelte").Snippet;
  }

  let {
    options = [],
    label,
    value = $bindable(""),
    placeholder = "",
    classes,
    children,
  }: Props = $props();

  function blur() {
    const elem: any = document.activeElement;
    if (elem) {
      elem?.blur();
    }
  }
</script>

<div class={classes}>
  {#if label}
    <label class="block mb-2">{label}</label>
  {/if}

  <div class="dropdown w-full">
    <label tabindex="0" class="select select-bordered w-full rounded-lg">
      {options.find((opt) => opt.value === value)?.label || placeholder}
    </label>
    <ul
      tabindex="0"
      class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full"
    >
      {#each options as option}
        <li>
          <button
            class={option.value === value ? "bg-primary text-white" : ""}
            on:click|preventDefault={() => {
              value = option.value;
              blur();
            }}
          >
            {option.label}
          </button>
        </li>
      {/each}
    </ul>
  </div>
  {@render children?.()}
</div>
