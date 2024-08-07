<script lang="ts">
  import type { CreateInstructionParams } from "$pages/api/instructions.json";
  import { useTranslations } from "$i18n/utils";
  export let preferredLocale;
  const t = useTranslations(preferredLocale);

  let instructionTitle = "";
  let instructionText = "";

  async function saveInstruction() {
    const newInstruction: CreateInstructionParams = {
      title: instructionTitle,
      instruction: instructionText,
    };

    const response = await fetch("/api/instructions.json", {
      method: "POST",
      body: JSON.stringify(newInstruction),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    alert(data.message);
  }
</script>

<div class="container max-w-5xl p-6 mx-auto p-4">
  <div class="w-full min-w-xs pt-2 lg:pt-6">
    <h1 class="pt-2 text-4xl font-bold pb-6">{t("prompt-library.instructions.add")}</h1>
    <form class="rounded pt-6 mb-4 space-y-6">
      <div class="grid grid-cols-1 gap-4 justify-center">
        <div>
          <p class="mb-2">{t("prompt-library.add.instructions.title")}</p>
          <input
            type="text"
            bind:value={instructionTitle}
            placeholder="e.g. add instruction title"
            class="input input-bordered w-full min-w-xs"
          />
        </div>
      </div>

      <div class="mb-4">
        <p class="mb-2">{t("prompt-library.add.instructions.text")}</p>
        <textarea
          bind:value={instructionText}
          placeholder="e.g. type instruction details..."
          class="input input-bordered min-w-xs shadow appearance-none min-h-96 w-full py-2 px-3"
        />
      </div>

      <div class="flex items-center justify-between">
        <button
          class="btn btn-active btn-primary py-4 px-8 font-normal"
          on:click|preventDefault={saveInstruction}
        >
          {t("prompt-library.add.instructions.save")}
        </button>
      </div>
    </form>
  </div>
</div>
