<script lang="ts">
  import { fade } from "svelte/transition";

  interface Props {
    type?: string;
    dismissible?: boolean;
    dismiss?: any;
    children?: import("svelte").Snippet;
  }

  let {
    type = "error",
    dismissible = true,
    dismiss,
    children,
  }: Props = $props();

  const iconWidth = "1.2rem";
</script>

<article class="rounded-lg {type}" role="alert" transition:fade>
  <span class="icon">
    {#if type === "success"}
      <svg
        width={iconWidth}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 22C14.7614 22 17.2614 20.8807 19.0711 19.0711C20.8807 17.2614 22 14.7614 22 12C22 9.2386 20.8807 6.7386 19.0711 4.92893C17.2614 3.11929 14.7614 2 12 2C9.2386 2 6.7386 3.11929 4.92893 4.92893C3.11929 6.7386 2 9.2386 2 12C2 14.7614 3.11929 17.2614 4.92893 19.0711C6.7386 20.8807 9.2386 22 12 22Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M12 5.5C12.6904 5.5 13.25 6.05965 13.25 6.75C13.25 7.44035 12.6904 8 12 8C11.3097 8 10.75 7.44035 10.75 6.75C10.75 6.05965 11.3097 5.5 12 5.5Z"
          fill="currentColor"
        />
        <path
          d="M12.25 17V10H11.75H11.25"
          stroke="black"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M10.5 17H14"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    {:else if type === "error"}
      <svg
        width={iconWidth}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 22C17.5229 22 22 17.5229 22 12C22 6.47715 17.5229 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5229 6.47715 22 12 22Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <path
          d="M14.8283 9.17139L9.17149 14.8282L14.8283 9.17139Z"
          fill="currentColor"
        />
        <path
          d="M14.8283 9.17139L9.17149 14.8282"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M9.17165 9.17139L14.8285 14.8282"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    {:else}
      <svg
        width={iconWidth}
        style="text-align: center; display: inline-block;"
        aria-hidden="true"
        focusable="false"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
      >
        <path
          fill="currentColor"
          d="M256 40c118.621 0 216 96.075 216 216 0 119.291-96.61 216-216 216-119.244 0-216-96.562-216-216 0-119.203 96.602-216 216-216m0-32C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm-36 344h12V232h-12c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h48c6.627 0 12 5.373 12 12v140h12c6.627 0 12 5.373 12 12v8c0 6.627-5.373 12-12 12h-72c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12zm36-240c-17.673 0-32 14.327-32 32s14.327 32 32 32 32-14.327 32-32-14.327-32-32-32z"
        />
      </svg>
    {/if}
  </span>

  <div class="text">
    {@render children?.()}
  </div>

  {#if dismissible}
    <button class="close" onclick={() => dismiss()} aria-label="Close">
      <svg
        width="0.5em"
        style="text-align: center; display: inline-block;"
        aria-hidden="true"
        focusable="false"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 352 512"
      >
        <path
          fill="currentColor"
          d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"
        />
      </svg>
    </button>
  {/if}
</article>

<style>
  article {
    color: #000;
    padding: 1rem;
    display: flex;
    align-items: center;
    margin: 0 0.5rem 0.5rem auto;
    min-width: 30rem;
  }
  .error {
    background: #ff6f70;
  }
  .success {
    background: #00ca92;
  }
  .info {
    background: #00b3f0;
  }
  .icon {
    display: inline-flex;
    width: 1.5rem;
  }
  .text {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }
  button {
    background: transparent;
    border: 0 none;
    padding: 0;
    margin: 0 0 0 auto;
    line-height: 1;
    font-size: 1rem;
  }
</style>
