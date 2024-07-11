<script>
  import { createEventDispatcher } from "svelte";

  let userInputText;
  const dispatch = createEventDispatcher();

  function submitAction(e) {
    e.preventDefault();
    dispatch('message', {
      text: userInputText,
    });
  }
</script>

<div class="w-full shadow-md border border-gray-200 rounded bg-base-100">
  <form
    class="px-4 py-2 flex space-x-4 items-center justify-between"
    on:submit={submitAction}
  >
    <div class="flex-1 space-y-2">
      <textarea
        id="article-text"
        class="w-full p-2 textarea textarea-ghost textarea-lg"
        placeholder="Write the article text here..."
        bind:value={userInputText}
      ></textarea>
    </div>
    <button
      class="btn btn-outline btn-primary font-bold py-2 px-4"
      type="submit"
    >
      Submit Article
    </button>
  </form>
</div>
