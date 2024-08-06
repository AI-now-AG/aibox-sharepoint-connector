<script>
  import { fade } from "svelte/transition";
  export let output;

  let copyText = "";
  let timer;
  function copyToClipboard() {
    navigator.clipboard
      .writeText(output)
      .then(() => {
        copyText = "copied";
        clearTimeout(timer);
        timer = setTimeout(() => {
          copyText = "";
        }, 2000);
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  }
</script>

<div class="card mt-2" transition:fade>
  <div class="chat-bubble bg-base-100 text-base-content flex flex-row">
    {#if output}
      <p class="py-2">{@html output}</p>
      <div class="flex flex-col justify-items-end order-last">
        <button class="btn p-2 btn-ghost" on:click={copyToClipboard}>
          {#if copyText}
            <svg
              class="w-3.5 h-3.5 text-primary"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 16 12"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M1 5.917 5.724 10.5 15 1.5"
              />
            </svg>
          {:else}
            <svg
              class="text-base-content"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.66683 11.3333H3.00016C2.07969 11.3333 1.3335 10.5871 1.3335 9.66666V3C1.3335 2.07952 2.07969 1.33333 3.00016 1.33333H9.66683C10.5873 1.33333 11.3335 2.07952 11.3335 3V4.66666M6.3335 14.6667H13.0002C13.9206 14.6667 14.6668 13.9205 14.6668 13V6.33333C14.6668 5.41285 13.9206 4.66666 13.0002 4.66666H6.3335C5.41302 4.66666 4.66683 5.41285 4.66683 6.33333V13C4.66683 13.9205 5.41302 14.6667 6.3335 14.6667Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          {/if}
        </button>
      </div>
    {:else}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        class="w-8 h-8"
      >
        <g stroke="currentColor">
          <circle
            cx="12"
            cy="12"
            r="9.5"
            fill="none"
            stroke-linecap="round"
            stroke-width="3"
          >
            <animate
              attributeName="stroke-dasharray"
              calcMode="spline"
              dur="1.125s"
              keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
              keyTimes="0;0.475;0.95;1"
              repeatCount="indefinite"
              values="0 150;42 150;42 150;42 150"
            />
            <animate
              attributeName="stroke-dashoffset"
              calcMode="spline"
              dur="1.125s"
              keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
              keyTimes="0;0.475;0.95;1"
              repeatCount="indefinite"
              values="0;-16;-59;-59"
            />
          </circle>
          <animateTransform
            attributeName="transform"
            dur="1.5s"
            repeatCount="indefinite"
            type="rotate"
            values="0 12 12;360 12 12"
          />
        </g>
      </svg>
    {/if}
  </div>
</div>
