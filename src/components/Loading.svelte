<script lang="ts">
  interface Props {
    show?: boolean;
    partial?: boolean;
  }

  let { show = $bindable(false), partial = false }: Props = $props();
</script>

{#if show}
  <div
    class="flex w-full h-full top-0 left-0 justify-center items-center bg-gray-200/20 z-50"
    class:fixed={!partial}
    class:absolute={partial}
  >
    <div class="flex justify-center items-center space-x-2">
      <span class="loading loading-spinner loading-lg bg-stone-500"></span>
    </div>
  </div>
{/if}
