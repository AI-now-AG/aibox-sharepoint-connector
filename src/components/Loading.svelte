<script lang="ts">
  interface Props {
    show?: boolean;
    partial?: boolean;
  }

  let { show = false, partial = false }: Props = $props();
</script>

{#if show}
  <div
    class="flex w-full h-full top-0 left-0 justify-center items-center bg-base-content/20 z-50"
    class:fixed={!partial}
    class:absolute={partial}
  >
    <div class="flex justify-center items-center space-x-2">
      <span class="loading loading-spinner loading-lg bg-neutral/80"></span>
    </div>
  </div>
{/if}
