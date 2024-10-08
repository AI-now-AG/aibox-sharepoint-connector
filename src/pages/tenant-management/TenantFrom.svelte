<script>
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import ColorPicker from "svelte-awesome-color-picker";
  export let tenant;
  const t = useTranslations();

  let hex = "#12100a";

  let rgb = {
    r: 18,
    g: 16,
    b: 10,
    a: 1,
  };

  let hsv = {
    h: 46,
    s: 45.38461538461539,
    v: 6.9609375,
    a: 1,
  };

  let color = "// instance of Colord";
</script>

<div class="container w-full mx-auto p-6" style="font-family: Inter;">
  <div class="flex flex-row space-x-4">
    <div class="flex-1 flex flex-col mb-4">
      <span class="mb-2 text-gray-400 font-medium text-sm">Diplay name</span>
      <input
        type="text"
        placeholder={"Display name"}
        class="input input-bordered w-full"
      />
    </div>

    <div class="flex-1 flex flex-col mb-4">
      <span class="mb-2 text-gray-400 font-medium text-sm">Name</span>
      <input
        type="text"
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
      <input
        type="text"
        placeholder={"Primary color"}
        class="input input-bordered w-full"
        name="color-input"
      />
      <ColorPicker
        bind:hex
        bind:rgb
        bind:hsv
        bind:color
        position="responsive"
        label={"Primary color"}
        name={"color-input"}
      />
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
