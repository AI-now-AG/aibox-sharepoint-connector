<script>
  // Components
  import InputForm from "$components/InputForm.svelte";
  import { fade } from "svelte/transition";

  import PromptConfiguration from "$components/PromptConfiguration.svelte";
  var input = "";
  var output = "";

  async function fetchHeadline(e) {
    e.preventDefault();

    console.log("hai");
    const userInputText = e.detail.text;
    if (userInputText) {
      input = userInputText;
      const article = new URLSearchParams({
        article: input,
      }).toString();
      const response = await fetch(`/api/headlines.json?${article}`);
      const data = await response.json();

      if (data && data.headlines) {
        console.log(data.headlines);
        output = data.headlines.replaceAll("\n", "<br>");
      }
    }
  }
</script>

<div class="flex-1">
  <div class="grid justify-items-end">
    <button
      class="btn btn-square bg-base-100 grid justify-items"
      onclick="configuration_dialog.showModal()"
    >
      <svg
        class="fill-neutral-content stroke-1"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#000000"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><path
          d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"
        ></path><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon></svg
      >
    </button>
    <PromptConfiguration />
  </div>

  <div class="flex flex-wrap">
    <div class="grow md:w-1/2 p-2">
      <h1 class="text-3xl pb-4">
        Hello Somedia, I help you with writing a headline
      </h1>
      <InputForm on:message={fetchHeadline} />
      {#if input}
        <div transition:fade>
          {#if output}
            <div class="chat chat-start mt-2" transition:fade>
              <div class="chat-bubble">
                {@html output}
              </div>
            </div>
          {/if}
          <div class="chat chat-end mt-2">
            <div class="chat-bubble bg-neutral-content text-info-content">
              {input}
            </div>
          </div>
        </div>
      {/if}
    </div>
    <!-- <div class="w-full md:w-2/5 p-2">
        <div role="tablist" class="tabs tabs-lifted">
          <input
            type="radio"
            name="history_tabs"
            role="tab"
            class="tab"
            aria-label="History"
            checked="checked"
          />
          <div
            role="tabpanel"
            class="tab-content bg-base-100 border-base-300 rounded-box p-6"
          >
            History List
          </div>
    
          <input
            type="radio"
            name="history_tabs"
            role="tab"
            class="tab"
            aria-label="Settings"/>
          <div
            role="tabpanel"
            class="tab-content bg-base-100 border-base-300 rounded-box p-6">
            Settings
          </div>
        </div>
      </div> -->
  </div>
</div>
