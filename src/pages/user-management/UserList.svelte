<script lang="ts">
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { onMount } from "svelte";
  import log from "$utils/log";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import { loading, showLoading, hideLoading } from "$stores";
  import { formatDateToDDMMYYHHMMSS } from "$utils/common";

  const t = useTranslations();

  export let tenantId: string = "";
  export let currentLoggedInUser: any = "";

  let users: any = [];
  let searchValue: string = "";
  let timeout: any;

  onMount(async () => {
    await fetchUsers();
  });

  const fetchUsers = async () => {
    showLoading();
    const { data, error } = await actions.user.listByTeant({
      tenantId,
      searchValue,
    });
    hideLoading();

    if (!error) {
      users = data;
      users = users.filter((_user: any) => {
        return _user.email != currentLoggedInUser.email;
      });
      log.i(users, "USER DATA");
    } else {
      log.e(error, "Error fetching users");
    }
  };

  const onSearchUser = ({ target }: any) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      searchValue = target.value;
      fetchUsers();
    }, 300);
  };

  function getRoleString(roles: string[]) {
    let isAdmin = false;
    for (let i = 0; i < roles?.length; i++) {
      const role = roles[i];
      if (role == "Super Admin") {
        isAdmin = true;
        break;
      } else if (role == "Admin") {
        isAdmin = true;
        break;
      }
    }
    return isAdmin ? t("user.admin") : t("user.user");
  }

  function getUserStatus(isBlocked: boolean, isVerified: boolean) {
    if (isBlocked) {
      return { text: t("user.blocked"), color: "#FF6F70" };
    } else if (!isVerified) {
      return { text: t("user.un-veriried"), color: "rgba(43, 52, 64, 0.2)" };
    } else {
      return { text: t("user.veriried"), color: "#00CA92" };
    }
  }
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
          on:input={onSearchUser}
          on:input
          on:blur
        />
      </label>
    </div>
  </div>

  <div>
    <h2 class="text-lg font-normal mb-4">
      {t("user.all-users") + ` (${users?.length ?? 0})`}
    </h2>

    <div class="relative">
      <table
        class=" border-separate border-spacing-x-0 border-spacing-y-3 min-w-full relative"
        style="font-family:Inter;"
      >
        <colgroup>
          <col class="w-auto" />
          <col class="w-auto" />
          <col class="w-28" />
          <col class="w-28" />
          <col class="w-auto" />
          <col class="w-auto" />
        </colgroup>
        <thead>
          <tr class="bg-base-300 rounded-lg">
            <th class="py-3 px-4 text-left font-normal text-xs rounded-l-lg"
              >{t("common.name")}</th
            >
            <th class="py-3 px-4 text-left font-normal text-xs"
              >{t("user.e-mail")}</th
            >
            <th class="py-3 px-4 text-left font-normal text-xs"
              >{t("user.role")}</th
            >
            <th class="py-3 px-4 text-left font-normal text-xs"
              >{t("user.logins")}</th
            >
            <th class="py-3 px-4 text-left font-normal text-xs"
              >{t("user.latest-login")}</th
            >
            <th class="py-3 px-4 text-left font-normal text-xs rounded-r-lg"
            ></th>
          </tr>
        </thead>
        <tbody>
          {#each users as user}
            <tr class="h-16 bg-base-100 hover:bg-base-300 text-sm rounded-lg">
              <td class="py-3 px-4 text-sm font-medium rounded-l-lg">
                <a
                  class="underline underline-offset-2"
                  href="/user-management/{user._id}">{user.name}</a
                >
              </td>
              <td
                class="py-3 px-4 text-gray-600 flex items-center text-sm font-medium h-16"
              >
                {user.email}
              </td>
              <td class="py-3 px-4 text-sm font-medium"
                >{getRoleString(user.roles)}</td
              >
              <td class="py-3 px-4 text-sm font-medium">
                {user.logins_count ?? 0}
              </td>
              <td class="py-3 px-4 text-sm font-medium">
                {user.last_login
                  ? formatDateToDDMMYYHHMMSS(user.last_login)
                  : "-"}
              </td>
              <td
                class="py-3 px-4 text-sm font-medium relative relative-dropdown rounded-r-lg"
                style={`color: ${getUserStatus(user.blocked, user.email_verified).color}`}
              >
                {getUserStatus(user.blocked, user.email_verified).text}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      <Loading partial={true} bind:show={$loading} />
    </div>
  </div>
</div>
