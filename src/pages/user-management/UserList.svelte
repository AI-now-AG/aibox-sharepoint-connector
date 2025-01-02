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
  import DropdownFilter, { UserRole } from "./DropdownFilter.svelte";
  import SortableTable, {
    type ColumnData,
  } from "$components/SortableTable.svelte";

  const t = useTranslations();

  export let tenantId: string = "";
  export let currentLoggedInUser: any = "";

  let colDatas: ColumnData[] = [
    { colId: "name", colName: t("common.name"), colCssClases: "w-auto" },
    { colId: "email", colName: t("user.e-mail"), colCssClases: "w-auto" },
    { colId: "", colName: t("user.role"), colCssClases: "w-28" },
    { colId: "logins_count", colName: t("user.logins"), colCssClases: "w-40" },
    {
      colId: "last_login",
      colName: t("user.latest-login"),
      colCssClases: "w-56",
    },
    { colId: "", colName: "", colCssClases: "w-auto" },
    { colId: "", colName: "", colCssClases: "w-28" },
  ];
  let users: any = [];

  let searchValue: string = "";
  let filterRolesParams: any[] = [];
  let filterStatusesParams: any = {};
  let previousFilterState: string = JSON.stringify({
    ...filterRolesParams,
    ...filterStatusesParams,
  });

  let selectedUser: any;
  let confirmBlockModal: HTMLDialogElement;
  let confirmDeleteModal: HTMLDialogElement;

  const fetchUsers = async () => {
    showLoading();
    const { data, error } = await actions.user.listByTeant({
      tenantId,
      searchValue,
      roles: filterRolesParams,
      ...filterStatusesParams,
    });
    hideLoading();
    previousFilterState = JSON.stringify({
      ...filterRolesParams,
      ...filterStatusesParams,
    });
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
</script>

<div class="container max-w-full mx-auto p-6">
  <InputSearch bind:value={searchValue} on:search={fetchUsers} />

  <DropdownFilter
    bind:rolesParams={filterRolesParams}
    bind:statusesParams={filterStatusesParams}
    on:filter={() => {
      const currentFilterState = JSON.stringify({
        ...filterRolesParams,
        ...filterStatusesParams,
      });
      if (currentFilterState != previousFilterState) {
        fetchUsers();
      }
    }}
  />

  <div class="mt-10">
    <h2 class="text-lg font-normal mb-4">
      {t("user.all-users") + ` (${users?.length ?? 0})`}
    </h2>

    <div class="relative">
      <SortableTable {colDatas} bind:rowDatas={users}>
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
      </SortableTable>
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
