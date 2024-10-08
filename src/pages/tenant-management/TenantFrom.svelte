<script>
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import ColorPicker, { ChromeVariant } from "svelte-awesome-color-picker";
  export let tenant;
  const t = useTranslations();

  let hex = "#491EFF";
  let color = "#491EFF";
  let selecteColor = "#491EFF";
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
        <div class="absolute top-0 left-0 relative flex">
          <div class="bg-gray-500">
            <ColorPicker
              bind:hex
              bind:color
              components={ChromeVariant}
              position="responsive"
              label={""}
              name={"color-input"}
              sliderDirection="horizontal"
              textInputModes={["hex"]}
              on:input={(event) => {
                console.log(event.detail.hex);
                selecteColor = event.detail.hex;
              }}
            />
          </div>
          <input
            type="text"
            value={selecteColor}
            placeholder={"Primary color"}
            class="input input-bordered flex-1"
            name="color-input"
          />
        </div>
      </div>
    </div>
  </div>

  <div class="w-full h-0.5 mt-4 mb-6 bg-gray-400/20" />

  <div class="mb-2"><span>API Keys</span></div>

  <div class="flex flex-row space-x-4">
    <div class="flex-1 flex flex-col">
      <span class="mb-2 text-gray-400 font-medium text-sm"> Open AI</span>
      <input
        type="text"
        placeholder={"API key"}
        class="input input-bordered w-full"
      />
    </div>

    <div class="flex-1 flex flex-col">
      <span class="mb-2 text-gray-400 font-medium text-sm">Azure Open AI</span>
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
</style>
