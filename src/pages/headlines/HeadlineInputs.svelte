<script>
  // Components
  import InputForm from "$components/InputForm.svelte";

  // API calls
  // import { getHeadline } from "$pages/api/headlines.json";

  var input = "";
  var output = "";

  async function fetchHeadline(e) {
    e.preventDefault();
    const userInputText = e.detail.text;
    if (userInputText) {
      input = userInputText;
      /*let response = await getHeadline(input); // global events to local news and human interest stories.
      if (response) {
        output = response;
      }*/
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
    <InputForm on:message={fetchHeadline} />
  </div>
</div>
