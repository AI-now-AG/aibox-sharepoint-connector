<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";

  export let label: string = "";
  export let type: HTMLButtonAttributes["type"] = "button";
  export let classes: string = "";
  export let onClick: () => void = () => {};
</script>

<button {type} class={`btn ${classes}`} on:click={onClick}>
  {label}
</button>
