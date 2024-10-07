<script>
  export let show = false;
</script>

{#if show}
  <div
    class="flex w-full h-full fixed top-0 left-0 justify-center items-center bg-black bg-opacity-80 z-50"
  >
    <div class="flex justify-center items-center space-x-2">
      <span class="loading loading-spinner loading-lg bg-cyan-50"></span>
    </div>
  </div>
{/if}
