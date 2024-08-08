<script>
  import { fade } from 'svelte/transition';
  import { useTranslations } from "$i18n/utils";
  export let preferredLocale;
  const t = useTranslations(preferredLocale);
  export let promptsEnriched;
  
  
  async function deletePrompt(id) {
    const response = await fetch(`/api/prompts.json`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ _id: id }),
    });

    if (response.ok) {
      const data = await response.json(); 
      promptsEnriched = promptsEnriched.filter(card => card._id !== id);
      // console.log(data);
    } else {
      console.error("API call failed");
    }
  }
</script>

<div class="container max-w-5xl mx-auto p-6 space-y-4">
  <label class="text-lg font-normal text-base-content/80">{t("prompt-library.prompts.all")}</label>

  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
    {#each promptsEnriched as prompt}
      <div class="card bg-base-100 shadow-xl" out:fade>
        <div class="card-body">
          <div class="card-actions justify-start">
            <div class="badge px-2 border-base-300">
              {prompt.categoryName}
            </div>
            <div class="badge px-2 border-base-300">{prompt.groupName}</div>
          </div>
          <h2 class="card-title">{prompt.title}</h2>
          <p class="text-base-content/60 line-clamp-3">
            {prompt.description}
          </p>
          <div class="flex flex-col space-y-2 items-end mt-4">
            <div class="card-actions">
              <a
                href={`prompts/${prompt._id.toString()}`}
                class="btn btn-primary font-light"
              >
                {t("prompt-library.prompts.view")}
              </a>
            </div>
            <button
              class="btn btn-link btn-xs font-normal text-accent-content"
              on:click={() => deletePrompt(prompt._id)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
