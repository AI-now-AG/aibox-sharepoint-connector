<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<script>
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import ColorPicker, { ChromeVariant } from "svelte-awesome-color-picker";

  const API_KEY_PROVIDER = {
    OpenAI: "openai",
    AzureOpenAI: "azure_open_ai",
  };

  export let tenant;
  const t = useTranslations();

  let hex = "#491EFF";
  let color = "#491EFF";
  let selecteColor = "#491EFF";

  let showPicker = false;
  function toggleColorPicker() {
    showPicker = !showPicker;
  }

  let apiKeyProvider = API_KEY_PROVIDER.AzureOpenAI;
  function selectApiKeyProvider(event) {
    apiKeyProvider = event.target.value;
    console.log(apiKeyProvider, "apiKeyProvider");
  }
</script>

<div class="container w-full mx-auto p-6" style="font-family: Inter;">
  <div class="flex flex-row space-x-4">
    <div class="flex-1 flex flex-col mb-4">
      <span class="mb-2 text-gray-400 font-medium text-sm">Diplay name</span>
      <input
        type="text"
        value={tenant?.name || ""}
        placeholder={"Display name"}
        class="input input-bordered w-full"
      />
    </div>

    <div class="flex-1 flex flex-col mb-4">
      <span class="mb-2 text-gray-400 font-medium text-sm">Name</span>
      <input
        type="text"
        value={tenant?.org_name || ""}
        placeholder={"Identification name"}
        class="input input-bordered w-full"
      />
    </div>
  </div>

  <div class="flex flex-row space-x-4">
    <div class="flex-1 flex flex-col mb-4">
      <span class="mb-2 text-gray-400 font-medium text-sm"
        >Default language</span
      >
      <select class="select select-bordered w-full">
        <option disabled selected>Default language?</option>
        <option selected>German</option>
        <option>English</option>
      </select>
    </div>

    <div class="flex-1 flex flex-col mb-4">
      <span class="mb-2 text-gray-400 font-medium text-sm">Default theme</span>
      <select class="select select-bordered w-full">
        <option disabled selected>Default language?</option>
        <option selected>Dark</option>
        <option>Light</option>
        <option>Somedia</option>
        <option>Luxury</option>
        <option>Lemonade</option>
      </select>
    </div>
  </div>

  <div class="flex flex-row space-x-4">
    <div class="w-2/4 flex flex-col">
      <span class="mb-2 text-gray-400 font-medium text-sm">Primary color</span>
      <div class="w-full">
        <div class="relative flex">
          <!-- <div class="w-8 pt-2 mr-2">
            <ColorPicker
              bind:hex
              bind:color
              components={{
                ...ChromeVariant,
              }}
              position="responsive"
              label={""}
              sliderDirection="horizontal"
              textInputModes={["hex"]}
              on:input={(event) => {
                selecteColor = event.detail.hex;
              }}
            />
          </div> -->
          <div>
            <div
              class="color-preview"
              style="background-color: {hex};"
              on:click={toggleColorPicker}
            />

            {#if showPicker}
              <div class="absolute picker-color">
                <ColorPicker
                  bind:hex
                  bind:color
                  isDialog={false}
                  components={{
                    ...ChromeVariant,
                  }}
                  position="responsive"
                  label={""}
                  sliderDirection="horizontal"
                  textInputModes={["hex"]}
                  on:input={(event) => {
                    selecteColor = event.detail.hex;
                  }}
                />
              </div>
            {/if}
          </div>
          <div
            class="flex flex-1 items-center input input-bordered color-input"
            on:click={toggleColorPicker}
          >
            <span>{selecteColor}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="w-full h-0.5 mt-4 mb-6 bg-gray-400/20" />

  <div class="mb-3"><span>API Keys</span></div>

  <div class="flex flex-row space-x-4">
    <div class="flex-1 flex flex-col">
      <div class="flex items-center mb-2">
        <input
          type="radio"
          name="radio-api-key"
          class="radio radio-primary"
          value={API_KEY_PROVIDER.OpenAI}
          checked={apiKeyProvider == API_KEY_PROVIDER.OpenAI}
          on:change={(event) => {
            selectApiKeyProvider(event);
          }}
        />
        <span class="ml-2 text-gray-400 font-medium text-sm"> Open AI</span>
      </div>
      <input
        type="text"
        placeholder={"API key"}
        class="input input-bordered w-full"
      />
    </div>

    <div class="flex-1 flex flex-col">
      <div class="flex items-center mb-2">
        <input
          type="radio"
          name="radio-api-key"
          class="radio radio-primary"
          value={API_KEY_PROVIDER.AzureOpenAI}
          checked={apiKeyProvider == API_KEY_PROVIDER.AzureOpenAI}
          on:change={(event) => {
            selectApiKeyProvider(event);
          }}
        />
        <span class="ml-2 text-gray-400 font-medium text-sm">Azure Open AI</span
        >
      </div>
      <input
        type="text"
        placeholder={"API key"}
        class="input input-bordered w-full"
      />
    </div>
  </div>

  <div class="w-full h-0.5 mt-4 mb-6 bg-gray-400/20" />
</div>

<style>
  .color-preview {
    width: 100px;
    height: 50px;
    display: inline-block;
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
  }
  .color-input {
    height: 50px;
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
  }
  .picker-color {
    top: 54px;
    left: 0px;
  }
</style>
