<script>
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  export let tenant;
  const t = useTranslations();
</script>

<div class="container w-full mx-auto p-6" style="font-family: Inter;">
  <div class="flex flex-row space-x-4">
    <div class="flex-1 flex flex-col mb-4">
      <span class="mb-2 text-gray-400 font-medium text-sm">Diplay name</span>
      <input
        type="text"
        value={tenant?.name}
        placeholder={"Display name"}
        class="input input-bordered w-full"
      />
    </div>

    <div class="flex-1 flex flex-col mb-4">
      <span class="mb-2 text-gray-400 font-medium text-sm">Name</span>
      <input
        type="text"
        value={tenant?.org_name}
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
