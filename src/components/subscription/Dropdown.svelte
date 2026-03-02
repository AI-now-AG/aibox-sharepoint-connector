<!-- svelte-ignore a11y_label_has_associated_control -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore event_directive_deprecated -->

<script lang="ts" module>
  /*
   const options = [
    { value: "_value", title: "_title" }
  ];
  */
  export interface Option {
    value: string;
    title: string;
  }
</script>

<script lang="ts">
  interface Props {
    options?: Option[];
    label?: string;
    value?: string;
    placeholder?: string;
    disabled?: boolean;
  }

  let {
    options = [],
    label,
    value = $bindable(""),
    placeholder = "",
    disabled = $bindable(false),
  }: Props = $props();

  function blur() {
    const elem: any = document.activeElement;
    if (elem) {
      elem?.blur();
    }
  }
</script>

<div class="flex-1">
  {#if label}
    <label
      class={"block mb-3 label-text text-base-content text-base-content text-sm" +
        (disabled ? "text-gray-400 " : " ")}>{label}</label
    >
  {/if}

  <div class="dropdown w-full">
    <label
      tabindex={disabled ? -1 : 0}
      class={"select select-bordered w-full rounded-lg h-[50px] shadow-xl" +
        (disabled ? " pointer-events-none opacity-50 bg-gray-200" : "")}
    >
      {options.find((opt) => opt.value === value)?.title || placeholder}
    </label>
    <ul
      tabindex={disabled ? -1 : 0}
      class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full"
    >
      {#each options as option}
        <li>
          <button
            class={option.value === value ? "bg-primary text-white" : ""}
            on:click|preventDefault={() => {
              if (!disabled) {
                value = option.value;
                blur();
              }
            }}
            {disabled}
          >
            {option.title}
          </button>
        </li>
      {/each}
    </ul>
  </div>
</div>
