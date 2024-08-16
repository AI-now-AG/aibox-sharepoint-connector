<script>
  import { fade } from "svelte/transition";
  import { useTranslations } from "$i18n/utils";
  export let preferredLocale;
  const t = useTranslations(preferredLocale);
  export let categoryEnriched;

  async function deletecCategoryEnriched(id) {
    const response = await fetch(`/api/categories.json`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ _id: id }),
    });

    if (response.ok) {
      const data = await response.json();
      categoryEnriched = categoryEnriched.filter(
        (card) => card._id !== id,
      );
    } else {
      console.error("API call failed");
    }
  }
</script>

<div class="container max-w-5xl mx-auto p-6 space-y-4">
  <label class="text-lg font-normal text-base-content/80">
    {t("prompt-library.instructions.all")}
  </label>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
    {#each categoryEnriched as category}
      <div class="card bg-base-100 shadow-xl" out:fade>
        <div class="card-body space-y-2">
          <div class="card-actions justify-start">
            <div class="badge px-2 bg-neutral text-neutral-content">
              {category.number}
            </div>
          </div>
          <h2 class="card-title">{category.title}</h2>
          <div class="flex flex-row items-center justify-between mt-4">
            <div class="card-actions">
              <a
                href={`categories/${category._id.toString()}`}
                class="btn btn-primary font-light"
              >
                {t("prompt-library.instructions.view")}
              </a>
            </div>
            <button
              class="btn btn-link btn-xs font-normal text-accent-content self-end"
              on:click={() => deletecCategoryEnriched(category._id)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
