<script>
  import { fade } from "svelte/transition";
  import Output from "./Output.svelte";
  export let input;
  export let output;
</script>

<div class="flex-1">
  <div class="flex flex-wrap">
    <div class="grow md:w-1/2 p-2 pb-4">
      {#if input}
        <div class="grid space-y-6" transition:fade>
          <div class="card grid justify-items-end mt-2">
            <div class="chat-bubble bg-neutral-content text-info-content">
              {input}
            </div>
          </div>
          <Output bind:output />
        </div>
      {/if}
    </div>
  </div>
</div>
