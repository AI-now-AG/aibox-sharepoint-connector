<script lang="ts">
  import { getHeadline } from "../webservice/ChatOpenAI.js";

  var userInputText = "";
  var input = "";
  var output = "";
  async function fetchHeadline(e: SubmitEvent) {
    e.preventDefault();
    if (userInputText) {
      input = userInputText;
      let response = await getHeadline(userInputText); // global events to local news and human interest stories.
      if (response) {
        output = response;
      }
    }
  }
</script>

<div class="flex-1 relative">
  <div class="bottom-0 left-0 right-0 p-4 flex flex-col">
    <div id="output"></div>
  </div>
  <div class="absolute bottom-0 w-full">
    {#if input}
      <div>
        <div class="chat chat-end mb-2">
          <div class="chat-bubble">
            {input}
          </div>
        </div>
        {#if output}
          <div class="chat chat-start mb-2">
            <div class="chat-bubble">
              {output}
            </div>
          </div>
        {/if}
      </div>
    {/if}
    <div class="w-full shadow-md border border-gray-200 rounded">
      <form
        class="px-4 py-2 flex space-x-4 items-center justify-between"
        on:submit={fetchHeadline}
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
  </div>
</div>
