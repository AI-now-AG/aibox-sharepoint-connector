<script lang="ts">
  import type { CreateCategoryParams } from "$pages/api/categories.json";

  /**
   * TODO: Please question the user flow of creating groups here. It will be more natural
   * to create groups on demand when creating prompts.
   */

  let title: string | undefined;
  let groups: string[] = [];

  async function save() {
    if (!title) {
      alert("Please enter category title");
    } else if (groups && groups.length > 0) {
      const newCategory: CreateCategoryParams = {
        title,
        groups,
      };

      const response = await fetch("/api/categories.json", {
        method: "POST",
        body: JSON.stringify(newCategory),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      groups = [];
      title = undefined;

      alert(data.message);
    } else {
      alert("At lease one group must be created");
    }
  }

  function addGroup() {
    if (groups && groups.length < 6) {
      groups = [...groups, ""];
    }
  }

  function removeGroup(index: number) {
    groups = groups.filter((_, i) => i !== index);
  }
</script>

<div class="container mx-auto p-4">
  <div class="w-full min-w-xs">
    <h1 class="text-4xl font-medium pb-6">Add Category</h1>
    <form class="rounded px-6 pt-6 mb-4 space-y-6">
      <div class="grid grid-cols-1 gap-4 justify-center">
        <div>
          <p class="mb-2">Title</p>
          <input
            type="text"
            bind:value={title}
            placeholder="e.g. Headline"
            class="input input-bordered w-full min-w-xs"
          />
        </div>
      </div>

      <div>
        <div class="flex items-center mb-2 space-x-4">
          <p class="text-xl">Add a new group by clicking on</p>

          <button
            class="btn btn-active btn-neutral font-normal grow-0"
            on:click|preventDefault={addGroup}
          >
            <svg
              width="13"
              height="12"
              viewBox="0 0 13 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.5 1V6M6.5 6V11M6.5 6H11.5M6.5 6L1.5 6"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
            Add a group
          </button>
        </div>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 justify-center"
        >
          {#each groups as _text, index (index)}
            <div class="flex flex-row items-center gap-4">
              <label class="input input-bordered flex items-center gap-2">
                <input
                  type="text"
                  bind:value={groups[index]}
                  placeholder="e.g. Headline"
                  class="grow w-full min-w-xs"
                />
              </label>
              <button
                class="btn btn-sm btn-circle btn-outline"
                on:click|preventDefault={removeGroup(index)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          {/each}
        </div>
      </div>

      <div class="flex items-center justify-between">
        <button
          class="btn btn-active btn-primary py-4 px-8 font-normal"
          on:click|preventDefault={save}
        >
          Save Category
        </button>
      </div>
    </form>
  </div>
</div>
