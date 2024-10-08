<script>
  export let show = false;
  export let partial = false;
</script>

{#if show}
  <div
    class="flex w-full h-full top-0 left-0 justify-center items-center bg-gray-200 bg-opacity-80 z-50"
    class:fixed={!partial}
    class:absolute={partial}
  >
    <div class="flex justify-center items-center space-x-2">
      <span class="loading loading-spinner loading-lg bg-stone-500"></span>
    </div>
  </div>
{/if}
