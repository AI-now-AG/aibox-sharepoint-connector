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
  import DropdownSection from "$components/DropdownSection.svelte";
  import { type Option } from "$components/DropdownOptions.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import { clickOutside } from "$components/actions/ClickOutside.svelte";

  const t = useTranslations();

  export let tenantId: string = "";
  export let currentLoggedInUser: any = "";

  let users: any = [];
  let searchValue: string = "";
  let searchTypingTimeout: any;
  let showUserFilter = false;
  let numberOfFilters = 0;

  let selectedUser: any;
  let confirmBlockModal: HTMLDialogElement;
  let confirmDeleteModal: HTMLDialogElement;

  const handleFilterMouseEnter = () => {
    showUserFilter = true;
  };
  const handleFilterMouseLeave = () => {
    showUserFilter = false;
  };

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
    clearTimeout(searchTypingTimeout);
    searchTypingTimeout = setTimeout(() => {
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

  function blockUser() {
    // TODO: Handle block
    const blockUserId = selectedUser._id ?? "";
    alert(selectedUser.name + " - " + blockUserId);
  }
  function onSelectBlock(user: any) {
    selectedUser = user;
    confirmBlockModal?.show();
  }

  function deleteUser() {
    // TODO: Handle delete
    const deleteUserId = selectedUser._id ?? "";
    alert(selectedUser.name + " - " + deleteUserId);
  }
  function onSelectDelete(user: any) {
    selectedUser = user;
    confirmDeleteModal?.show();
  }

  function getOptions(user: any) {
    let options: Option[] = [
      {
        id: "1",
        icon: svgIcons.block,
        text: t("common.block"),
        action: () => {
          onSelectBlock(user);
        },
      },
      {
        id: "2",
        icon: svgIcons.trash,
        text: t("common.delete"),
        action: () => {
          onSelectDelete(user);
        },
      },
      {
        id: "3",
        icon: svgIcons.edit,
        text: t("common.edit"),
        action: () => {
          window.location.href = `/user-management/${user._id}`;
        },
      },
    ];
    return options;
  }
</script>

<div class="container max-w-full mx-auto p-6">
  <div class="items-center mb-2">
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

  <div class="">
    <button
      class="dropdown dropdown-hover dropdown-start"
      use:clickOutside
      on:click={() => (showUserFilter = true)}
      on:clickoutside={() => {
        showUserFilter = false;
      }}
      on:mouseenter={handleFilterMouseEnter}
      on:mouseleave={handleFilterMouseLeave}
    >
      <div class="btn btn-sm btn-active font-normal bg-base-200">
        {@html svgIcons.filter}
        {t("common.filter")}
        {#if numberOfFilters > 0}
          <div class="badge badge-primary badge-md">{numberOfFilters}</div>
        {/if}
        {@html svgIcons.arrowDownFill}
      </div>
      {#if showUserFilter}
        <ul
          class="dropdown-content menu bg-base-100 rounded-xl z-[1] p-3 shadow w-52"
        >
          <div class="flex justify-center items-center">
            <span class="flex-1 text-left text-sm font-bold"
              >{t("common.filter")}</span
            >
            <button class="text-xs font-bold">✕</button>
          </div>

          <div class="w-full h-[1px] bg-slate-200 mt-2 mb-2"></div>

          <div class="w-full text-sm">
            <div class="w-full text-left">{t("user.role")}</div>
            <label
              class="flex items-center ml-4 p-2 rounded-lg hover:bg-gray-200"
            >
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-neutral mr-2"
                checked={true}
                on:change={() => null}
              />
              <span class="font-normal">{t("user.user")}</span>
            </label>

            <label
              class="flex items-center ml-4 p-2 rounded-lg hover:bg-gray-200"
            >
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-neutral mr-2"
                checked={true}
                on:change={() => null}
              />
              <span class="font-normal">{t("user.admin")}</span>
            </label>
          </div>

          <div class="w-full mt-4">
            <div class="w-full text-left">{t("user.status")}</div>
            <label
              class="flex items-center ml-4 p-2 rounded-lg hover:bg-gray-200"
            >
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-neutral mr-2"
                checked={true}
                on:change={() => null}
              />
              <span class="font-normal">{t("common.block")}</span>
            </label>

            <label
              class="flex items-center ml-4 p-2 rounded-lg hover:bg-gray-200"
            >
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-neutral mr-2"
                checked={true}
                on:change={() => null}
              />
              <span class="font-normal">{t("user.un-veriried")}</span>
            </label>

            <label
              class="flex items-center ml-4 p-2 rounded-lg hover:bg-gray-200"
            >
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-neutral mr-2"
                checked={true}
                on:change={() => null}
              />
              <span class="font-normal">{t("user.veriried")}</span>
            </label>
          </div>
        </ul>
      {/if}
    </button>
  </div>

  <div class="mt-10">
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
            <th class=""></th>
            <th class="rounded-r-lg"></th>
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
                class="py-3 px-4 text-sm font-medium"
                style={`color: ${getUserStatus(user.blocked, user.email_verified).color}`}
              >
                {getUserStatus(user.blocked, user.email_verified).text}
              </td>

              <td
                class="py-3 px-4 text-sm font-medium relative relative-dropdown rounded-r-lg"
              >
                <DropdownSection cssClasses="" options={getOptions(user)} />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<ConfirmDialog
  title={t("user.block-confirm-message")}
  description={t("user.block-description-message")}
  bind:modal={confirmBlockModal}
  on:confirm={blockUser}
/>
<ConfirmDialog
  title={t("user.delete-confirm-message")}
  description={t("user.delete-description-message")}
  bind:modal={confirmDeleteModal}
  on:confirm={deleteUser}
/>

<Loading partial={true} bind:show={$loading} />
