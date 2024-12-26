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
  let searchValue = "";
  let timeout;

  onMount(async () => {
    await fetchUsers();
  });

  const fetchUsers = async () => {
    showLoading();
    const { data, error } = await actions.user.list({
      searchValue,
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
      fetchUsers();
    }, 300);
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
          placeholder={t("user.search-for-users")}
          on:input={onSearchTenant}
          on:input
          on:blur
        />
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
