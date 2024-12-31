<script lang="ts">
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { onMount } from "svelte";
  import log from "$utils/log";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import { loading, showLoading, hideLoading } from "$stores";
  import { formatDateToDDMMYY } from "$utils/common";
  import DropdownSection from "$components/DropdownSection.svelte";
  import { type Option } from "$components/DropdownOptions.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import InputSearch from "./InputSearch.svelte";

  const t = useTranslations();

  export let tenantId: string = "";
  export let currentLoggedInUser: any = "";

  const enum UserRole {
    Admin = "Admin",
    SuperAdmin = "Super Admin",
    User = "User",
  }

  let users: any = [];
  let searchValue: string = "";
  let showUserFilter = false;
  let numberOfFilters = 0;

  let isFilterUser: boolean = false;
  let isFilterAdmin: boolean = false;
  let filterRolesParams: any[] = [];

  let isFilterVerified: boolean = false;
  let isFilterUnVerified: boolean = false;
  let isFilterBlocked: boolean = false;
  let filterStatusesParams: any = {};

  $: if (isFilterUser) {
    filterRolesParams.push(UserRole.User);
  } else {
    filterRolesParams = filterRolesParams.filter((_role) => {
      return _role != UserRole.User;
    });
  }
  $: if (isFilterAdmin) {
    filterRolesParams.push(UserRole.SuperAdmin);
    filterRolesParams.push(UserRole.Admin);
  } else {
    filterRolesParams = filterRolesParams.filter((_role) => {
      return _role != UserRole.Admin && _role != UserRole.SuperAdmin;
    });
  }

  $: if (isFilterVerified) {
    filterStatusesParams = {
      ...filterStatusesParams,
      isVerified: isFilterVerified,
    };
  } else {
    delete filterStatusesParams.isVerified;
  }

  $: if (isFilterUnVerified) {
    filterStatusesParams = {
      ...filterStatusesParams,
      isUnVerified: isFilterUnVerified,
    };
  } else {
    delete filterStatusesParams.isUnVerified;
  }

  $: if (isFilterBlocked) {
    filterStatusesParams = {
      ...filterStatusesParams,
      isBlocked: isFilterBlocked,
    };
  } else {
    delete filterStatusesParams.isBlocked;
  }

  let selectedUser: any;
  let confirmBlockModal: HTMLDialogElement;
  let confirmDeleteModal: HTMLDialogElement;

  function handleClickFilter() {
    if (showUserFilter) {
      showUserFilter = false;
      fetchUsers();
    } else {
      showUserFilter = true;
    }
  }

  function calculateNumberOfFitler() {
    numberOfFilters = 0;
    const a: any = {};
    for (let i = 0; i < filterRolesParams.length; i++) {
      const role = filterRolesParams[i];
      if (!a[role]) {
        if (role == UserRole.SuperAdmin) {
          continue;
        }
        numberOfFilters += 1;
        a[role] = true;
      }
    }
    if (filterStatusesParams.isBlocked) {
      numberOfFilters += 1;
    }
    if (filterStatusesParams.isVerified) {
      numberOfFilters += 1;
    }
    if (filterStatusesParams.isUnVerified) {
      numberOfFilters += 1;
    }
  }

  $: if (
    isFilterUser ||
    isFilterAdmin ||
    isFilterVerified ||
    isFilterUnVerified ||
    isFilterBlocked
  ) {
    calculateNumberOfFitler();
  } else {
    numberOfFilters = 0;
  }

  const fetchUsers = async () => {
    showLoading();
    const { data, error } = await actions.user.listByTeant({
      tenantId,
      searchValue,
      roles: filterRolesParams,
      ...filterStatusesParams,
    });
    hideLoading();

    if (!error) {
      users = data;
    } else {
      log.e(error, "Error fetching users");
    }
  };

  onMount(async () => {
    await fetchUsers();
  });

  function getRoleString(roles: string[]) {
    let isAdmin = false;
    for (let i = 0; i < roles?.length; i++) {
      const role = roles[i];
      if (role == UserRole.SuperAdmin) {
        isAdmin = true;
        break;
      } else if (role == UserRole.Admin) {
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

  async function handleBlockingUser() {
    showLoading();
    const { _id = "", blocked } = selectedUser;
    let result;
    if (blocked) {
      result = await actions.user.unblock({
        _id,
      });
    } else {
      result = await actions.user.block({
        _id,
      });
    }
    hideLoading();
    const { error } = result;
    log.d(result, "updateUserStatus result");
    if (!error) {
      addToast({
        message: blocked
          ? t("user.un-block-successful")
          : t("user.block-successful"),
        type: "success",
      });
      await fetchUsers();
    } else {
      log.e(error, "Error updating user status");
      addToast({
        message: blocked ? t("user.un-block-failed") : t("user.block-failed"),
        type: "error",
      });
    }
  }
  function onSelectBlock(user: any) {
    selectedUser = user;
    confirmBlockModal?.show();
  }

  async function deleteUser() {
    const { _id = "" } = selectedUser;
    let result = await actions.user.delete({
      _id,
    });
    hideLoading();
    const { error } = result;
    log.d(result, "delete user result");
    if (!error) {
      addToast({
        message: t("user.delete-successful"),
        type: "success",
      });
      await fetchUsers();
    } else {
      log.e(error, "Error deleting user");
      addToast({
        message: t("user.delete-failed"),
        type: "error",
      });
    }
  }
  function onSelectDelete(user: any) {
    selectedUser = user;
    confirmDeleteModal?.show();
  }

  function getOptions(user: any) {
    let options: Option[] = [
      {
        icon: svgIcons.edit,
        text: t("common.edit"),
        action: () => {
          window.location.href = `/user-management/${user._id}`;
        },
      },
    ];
    if (user.email != currentLoggedInUser.email) {
      options.unshift({
        icon: svgIcons.trash,
        text: t("common.delete"),
        action: () => {
          onSelectDelete(user);
        },
      });
      options.unshift({
        icon: svgIcons.block,
        text: user.blocked ? t("common.un-block") : t("common.block"),
        action: () => {
          onSelectBlock(user);
        },
      });
    }

    return options;
  }

  let sortColumn = "";
  let sortDirection = "asc";

  function sort(col: string) {
    if (sortColumn === col) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = col;
      sortDirection = "asc";
    }

    users = users.sort((a: any, b: any) => {
      if (sortDirection === "asc") {
        if (col == "name" || col == "email") {
          return a[col].localeCompare(b[col]);
        }
        return a[col] > b[col] ? 1 : -1;
      } else {
        if (col == "name" || col == "email") {
          return b[col].localeCompare(a[col]);
        }
        return a[col] < b[col] ? 1 : -1;
      }
    });
  }
</script>

<div class="container max-w-full mx-auto p-6">
  <InputSearch bind:value={searchValue} on:search={fetchUsers}  />

  <div class="">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class=""
      on:click={() => {
        handleClickFilter();
      }}
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
        <div
          class="menu bg-base-100 rounded-xl z-[1] p-3 shadow w-52 mt-1 absolute"
        >
          <div class="flex justify-center items-center">
            <span class="flex-1 text-left text-sm font-bold"
              >{t("common.filter")}</span
            >
            <button
              class="btn btn-ghost btn-sm"
              on:click|stopPropagation={() => {
                showUserFilter = false;
                fetchUsers();
              }}
            >
              {@html svgIcons.filter}</button
            >
          </div>

          <div class="w-full h-[1px] bg-slate-200 mt-2 mb-2"></div>

          <div class="w-full text-sm">
            <div class="w-full text-left">{t("user.role")}</div>
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <label
              on:click|stopPropagation={() => null}
              class="flex items-center ml-4 p-2 rounded-lg hover:bg-gray-200"
            >
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-neutral mr-2"
                bind:checked={isFilterUser}
              />
              <span class="font-normal">{t("user.user")}</span>
            </label>

            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <label
              on:click|stopPropagation={() => null}
              class="flex items-center ml-4 p-2 rounded-lg hover:bg-gray-200"
            >
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-neutral mr-2"
                bind:checked={isFilterAdmin}
              />
              <span class="font-normal">{t("user.admin")}</span>
            </label>
          </div>

          <div class="w-full mt-4">
            <div class="w-full text-left">{t("user.status")}</div>
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <label
              on:click|stopPropagation={() => null}
              class="flex items-center ml-4 p-2 rounded-lg hover:bg-gray-200"
            >
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-neutral mr-2"
                bind:checked={isFilterBlocked}
              />
              <span class="font-normal">{t("common.block")}</span>
            </label>

            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <label
              on:click|stopPropagation={() => null}
              class="flex items-center ml-4 p-2 rounded-lg hover:bg-gray-200"
            >
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-neutral mr-2"
                bind:checked={isFilterUnVerified}
              />
              <span class="font-normal">{t("user.un-veriried")}</span>
            </label>

            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <label
              on:click|stopPropagation={() => null}
              class="flex items-center ml-4 p-2 rounded-lg hover:bg-gray-200"
            >
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-neutral mr-2"
                bind:checked={isFilterVerified}
              />
              <span class="font-normal">{t("user.veriried")}</span>
            </label>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div class="mt-10">
    <h2 class="text-lg font-normal mb-4">
      {t("user.all-users") + ` (${users?.length ?? 0})`}
    </h2>

    <div class="relative">
      <table
        class="border-separate border-spacing-x-0 border-spacing-y-3 min-w-full relative"
        style="font-family:Inter;"
      >
        <colgroup>
          <col class="w-auto" />
          <col class="w-auto" />
          <col class="w-28" />
          <col class="w-40" />
          <col class="w-56" />
          <col class="w-auto" />
          <col class="w-28" />
        </colgroup>
        <thead>
          <tr class="bg-base-300 rounded-lg">
            <th
              class="py-3 px-4 text-left font-normal text-xs rounded-l-lg"
              on:click={() => sort("name")}
            >
              {t("common.name")}
              <span class="ml-2">
                {sortColumn === "name"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : "☰"}
              </span>
            </th>
            <th
              class="py-3 px-4 text-left font-normal text-xs"
              on:click={() => sort("email")}
            >
              {t("user.e-mail")}
              <span class="ml-2">
                {sortColumn === "email"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : "☰"}
              </span></th
            >
            <th class="py-3 px-4 text-left font-normal text-xs">
              {t("user.role")}
            </th>
            <th
              class="py-3 px-4 text-left font-normal text-xs"
              on:click={() => sort("logins_count")}
            >
              {t("user.logins")}
              <span class="ml-2">
                {sortColumn === "logins_count"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : "☰"}
              </span>
            </th>
            <th
              class="py-3 px-4 text-left font-normal text-xs"
              on:click={() => sort("last_login")}
            >
              {t("user.latest-login")}
              <span class="ml-2">
                {sortColumn === "last_login"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : "☰"}
              </span>
            </th>
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
                  href="/user-management/{user._id}">{user.name ?? "-"}</a
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
                {user.logins_count ?? "-"}
              </td>
              <td class="py-3 px-4 text-sm font-medium">
                {user.last_login ? formatDateToDDMMYY(user.last_login) : "-"}
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

<!-- confirm block dialog -->
<ConfirmDialog
  title={selectedUser?.blocked
    ? t("user.un-block-confirm-message")
    : t("user.block-confirm-message")}
  description={selectedUser?.blocked
    ? t("user.un-block-description-message")
    : t("user.block-description-message")}
  bind:modal={confirmBlockModal}
  on:confirm={handleBlockingUser}
/>

<!-- confirm delete dialog -->
<ConfirmDialog
  title={t("user.delete-confirm-message")}
  description={t("user.delete-description-message")}
  bind:modal={confirmDeleteModal}
  on:confirm={deleteUser}
/>

<Loading partial={true} bind:show={$loading} />
