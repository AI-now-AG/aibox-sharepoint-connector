<script lang="ts">
  export let promptId = "";
  export let input = "";
  let inputText = "";
  export let output = "";

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && e.ctrlKey) {
      fetchHeadline();
    }
  }

  async function fetchHeadline() {
    input = "";

    if (inputText) {
      input = inputText;
      output = "";
      try {
        const response = await fetch("/api/promptExecution.json", {
          method: "POST",
          body: JSON.stringify({
            article: inputText,
            promptId: promptId,
          }),
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (data && data.headlines) {
          output = data.headlines.replaceAll("\n", "<br>");
        } else {
          output = data.message;
        }
      } catch (error) {
        console.error("Fetch headlines error:" + error);
      }
    }
  }
</script>

<div
  class="rounded-xl bg-base-100 border border-base-content/20 focus:ring-base-200 has-[:focus]:ring-2 has-[:focus]:ring-base-primary has-[:focus]:ring-offset-2 has-[:focus]:ring-offset-base-200"
>
  <textarea
    name="input"
    id="input"
    class="textarea textarea-ghost h-32 w-full focus:outline-none focus:border-base-100 text-base"
    placeholder="Your input..."
    bind:value={inputText}
    on:keydown={onKeyDown}
  ></textarea>
  <div class="grid grid-cols-[1fr_min-content] gap-4">
    <div class="p-4 flex flex-row gap-2">
      <button class="btn h-auto w-auto p-1 min-h-0" disabled={!promptId}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          class="w-6 h-6"
        >
          <path
            fill="currentColor"
            d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm0-2h14V5H5zm1-2h12l-3.75-5l-3 4L9 13zm-1 2V5zm3.5-9q.625 0 1.063-.437T10 8.5t-.437-1.062T8.5 7t-1.062.438T7 8.5t.438 1.063T8.5 10"
          ></path>
        </svg>
      </button>
      <button class="btn h-auto w-auto p-1 min-h-0" disabled={!promptId}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          class="w-6 h-6"
        >
          <path
            fill="currentColor"
            d="M18.5 2h-13C3.6 2 2 3.6 2 5.5v13C2 20.4 3.6 22 5.5 22H16l6-6V5.5C22 3.6 20.4 2 18.5 2m1.6 13h-1.5c-1.9 0-3.5 1.6-3.5 3.5V20H5.8c-1 0-1.8-.8-1.8-1.8V5.8C4 4.8 4.8 4 5.8 4h12.5c1 0 1.8.8 1.8 1.8zM7 7h10v2H7zm0 4h10v2H7zm0 4h6v2H7z"
          ></path>
        </svg>
      </button>
    </div>
    <button
      class="btn btn-ghost btn-md self-center disabled:bg-base-100 disabled:text-slate-500 disabled:cursor-not-allowed"
      disabled={!promptId}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        class={`w-8 h-8 ${promptId ? "text-primary" : "text-base-300"}`}
        on:click|preventDefault={fetchHeadline}
      >
        <path fill="currentColor" d="M3 20v-6l8-2l-8-2V4l19 8z"></path>
      </svg>
    </button>
  </div>
</div>
