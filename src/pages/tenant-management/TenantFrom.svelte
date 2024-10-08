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
        placeholder={"Display name"}
        class="input input-borderedw-full"
      />
    </div>

    <div class="flex-1 flex flex-col mb-4">
      <span class="mb-2 text-gray-400 font-medium text-sm">Name</span>
      <input
        type="text"
        placeholder={"Identification name"}
        class="input input-borderedw-full"
      />
    </div>
  </div>

  <div class="flex flex-row space-x-4">
    <div class="flex-1 flex flex-col mb-4">
      <span class="mb-2 text-gray-400 font-medium text-sm"
        >Default language</span
      >
      <input type="text" class="input input-borderedw-full" />
    </div>

    <div class="flex-1 flex flex-col mb-4">
      <span class="mb-2 text-gray-400 font-medium text-sm">Default theme</span>
      <input
        type="text"
        placeholder={"Default theme"}
        class="input input-borderedw-full"
      />
    </div>
  </div>

  <div class="flex flex-row space-x-4">
    <div class="w-2/4 flex flex-col">
      <span class="mb-2 text-gray-400 font-medium text-sm">Primary color</span>
      <input
        type="text"
        placeholder={"Primary color"}
        class="input input-borderedw-full"
      />
    </div>
  </div>

  <div class="w-full h-0.5 mt-4 mb-6 bg-gray-400/20" />

  <div class="flex flex-row space-x-4">
    <div class="flex-1 flex flex-col">
      <span class="mb-2 text-gray-400 font-medium text-sm"> Open AI</span>
      <input type="text" class="input input-borderedw-full" />
    </div>

    <div class="flex-1 flex flex-col">
      <span class="mb-2 text-gray-400 font-medium text-sm">Azure Open AI</span>
      <input
        type="text"
        placeholder={"Default theme"}
        class="input input-borderedw-full"
      />
    </div>
  </div>

  <div class="w-full h-0.5 mt-4 mb-6 bg-gray-400/20" />
</div>

<style>
</style>
