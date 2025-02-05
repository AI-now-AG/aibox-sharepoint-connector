<script lang="ts" module>
  export interface Option {
    icon: any;
    text: string;
    action: Function;
  }
</script>

<script lang="ts">
  interface Props {
    options?: Option[];
    widthClass?: string;
    styleVisibility?: string;
  }

  let {
    options = [],
    widthClass = "w-48",
    styleVisibility = $bindable(""),
  }: Props = $props();
</script>

<ul
  class={`py-2 dropdown-content menu bg-base-100 rounded-xl z-[1] p-2 shadow ${widthClass}`}
  style={styleVisibility}
>
  {#each options as option}
    <li>
      <button
        class="flex items-center px-4 py-2 text-base-content font-sans w-full"
        onclick={(e) => {
          option.action();
        }}
      >
        <span class="w-5 h-5 flex items-center"> {@html option.icon}</span>
        <span class="text-sm font-semibold ml-1 text-left">{option.text}</span>
      </button>
    </li>
  {/each}
</ul>
