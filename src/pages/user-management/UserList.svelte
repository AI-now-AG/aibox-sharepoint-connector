<script>
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { onMount } from "svelte";
  import log from "$utils/log";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import { loading, showLoading, hideLoading } from "$stores";

  const t = useTranslations();

  let users = [];
  let showArchived = false;
  let searchValue = "";
  let timeout;

  onMount(async () => {
    await fetchTenants();
  });

  const fetchTenants = async () => {
    showLoading();
    const { data, error } = await actions.tenant.list({
      searchValue,
      showArchived,
    });
    hideLoading();

    if (!error) {
      users = data;
    } else {
      log.e(error, "Error fetching users");
    }
  };

  const onSearchTenant = ({ target: t }) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      searchValue = t.value;
      fetchTenants();
    }, 300);
  };

  const onShowArchived = (event) => {
    showArchived = !showArchived;
    setTimeout(() => (event.target.checked = showArchived), 0);
    fetchTenants();
  };
</script>

<div class="container max-w-full mx-auto p-6">
  <div class="items-center mb-10">
    <div class="relative w-full">
      <label class="input input-bordered flex items-center gap-2">
        {@html svgIcons.search}
        <input
          type="text"
          class="grow text-sm"
          placeholder={""}
          on:input={onSearchTenant}
          on:input
          on:blur
        />
      </label>
    </div>
    <div class="mt-4">
      <label class="flex items-center space-x-2">
        <input
          type="checkbox"
          class="checkbox border-gray-300 rounded focus:ring-indigo-500 w-5 h-5"
          checked={showArchived}
          on:click|preventDefault={onShowArchived}
        />
        <span class="label-text">{""}</span>
      </label>
    </div>
  </div>

  <div>
    <h2 class="text-lg font-normal mb-4">Title</h2>

    <div class="relative">
      <Loading partial={true} bind:show={$loading} />
    </div>
  </div>
</div>
