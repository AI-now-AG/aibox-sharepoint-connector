<script lang="ts" context="module">
  export interface Option {
    id: string;
    icon: any;
    text: string;
    action: Function;
  }
</script>

<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  const t = useTranslations();
  export let options: Option[] = [];
</script>

<ul
  class="py-2 dropdown-content menu bg-base-100 rounded-xl z-[1] w-48 p-2 shadow"
>
  {#each options as option}
    <li>
      <button
        class="flex items-center px-4 py-2 text-gray-700 font-sans w-full"
        on:click={(e) => {
          e.stopPropagation();
          option.action();
        }}
      >
        <span class="w-5 h-5 flex items-center"> {@html option.icon}</span>
        <span class="text-sm font-semibold ml-1 text-left">{option.text}</span>
      </button>
    </li>
  {/each}
</ul>
