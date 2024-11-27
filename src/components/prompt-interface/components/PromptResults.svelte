<script>
  import { fade } from "svelte/transition";
  import Output from "./Output.svelte";
  export let input;
  export let output;
</script>

{#if input}
  <div class="flex-1 h-full">
    <div class="flex flex-wrap h-full">
      <div class="grow md:w-1/2 p-2 pb-4 h-full">
        <div class="grid space-y-6 h-full" transition:fade>
          <Output bind:output />
        </div>
      </div>
    </div>
  </div>
{/if}
