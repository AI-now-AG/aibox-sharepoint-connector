<script lang="ts">
  import { actions } from "astro:actions";
  import { navigate } from "astro:transitions/client";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { onMount } from "svelte";
  import log from "$utils/log";
  import { tenant } from "$stores";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import { user as currentUser } from "$stores";
  import { formatDate } from "$utils/common";
  import { getRoleString } from "$utils/roles";
  import DropdownSection from "$components/DropdownSection.svelte";
  import { type Option } from "$components/DropdownOptions.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import InputSearch from "./InputSearch.svelte";
  import DropdownFilter from "./DropdownFilter.svelte";
  import SortableTable, {
    type ColumnData,
  } from "$components/SortableTable.svelte";

  const t = useTranslations();
  let loading = $state(false);

  interface Props {
    tenantId?: string;
  }

  let { tenantId = "" }: Props = $props();

  const columnData: ColumnData[] = [
    { key: "name", name: t("common.name"), class: "w-auto" },
    { key: "email", name: t("user.e-mail"), class: "w-auto" },
    { key: "", name: t("user.role"), class: "w-[100px]" },
    { key: "logins_count", name: t("user.logins"), class: "w-[80px]" },
    { key: "last_login", name: t("user.latest-login"), class: "w-[140px]" },
    { key: "", name: "", class: "w-[120px]" },
    { key: "", name: "", class: "w-[50px]" },
  ];
  let total: number = $state(0);
  let limitReached: boolean = $state(false);
  let isRestrictUserManagement: boolean = $state(
    $tenant?.is_restrict_user_managment || false,
  );
  let users: any = $state([]);

  let searchValue: string = $state("");
  let filterRolesParams: any[] = $state([]);
  let filterStatusesParams: any = $state({});

  let previousFilterState: string = JSON.stringify({
    ...[],
    ...{},
  });

  let selectedUser: any = $state();
  let confirmBlockModal: HTMLDialogElement | undefined = $state();
  let confirmDeleteModal: HTMLDialogElement | undefined = $state();

  let childRefDropdownFilter: any;
  function hideDropdownFilter() {
    childRefDropdownFilter?.hideDropdownFilter();
  }

  //$inspect(selectedUser);
  //$inspect(users);

  $effect(() => {
    if (searchValue == "" || searchValue) {
      hideDropdownFilter();
    }
  });

  const fetchUsers = async () => {
    loading = true;
    const { data, error } = await actions.user.listByTenant({
      tenantId,
      searchValue,
      roles: filterRolesParams,
      ...filterStatusesParams,
    });
    loading = false;
    previousFilterState = JSON.stringify({
      ...filterRolesParams,
      ...filterStatusesParams,
    });
    if (!error) {
      console.log("data", data);
      total = data.total;
      limitReached = data.limit_reached || false;
      users = data.users;
    } else {
      log.e(error, "Error fetching users");
    }
  };

  onMount(async () => {
    await fetchUsers();
  });

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
    loading = true;
    const { _id = "", blocked } = selectedUser;
    const result = await actions.user.updateBlocked({
      _id,
      blocked: !blocked,
    });

    loading = false;
    const { error } = result;
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
    confirmBlockModal?.showModal();
  }

  async function deleteUser() {
    const { _id = "" } = selectedUser;
    let result = await actions.user.delete({
      _id,
    });
    loading = false;
    const { error } = result;
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
    confirmDeleteModal?.showModal();
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
    if (user.email != $currentUser?.email) {
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

<div class="container max-w-7xl mx-auto py-6">
  <div class="flex space-y-2 justify-between items-center">
    <h1 class="text-4xl font-bold">
      {t("user.user-management")}
    </h1>
    {#if !isRestrictUserManagement}
      <button
        onclick={() => navigate("/user-management/add")}
        class="btn btn-outline font-normal"
        disabled={limitReached}
      >
        {@html svgIcons.add}
        {t("user.add-new-user")}
      </button>
    {/if}
  </div>

  {#if limitReached}
    <div role="alert" class="alert alert-warning my-3">
      {@html svgIcons.alertSuccess}
      <span>{@html t("tenant.reached-user-limit-contact-upgrade")}</span>
    </div>
  {/if}

  <InputSearch bind:value={searchValue} onsearch={fetchUsers} />

  <DropdownFilter
    bind:this={childRefDropdownFilter}
    bind:rolesParams={filterRolesParams}
    bind:statusesParams={filterStatusesParams}
    onfilter={() => {
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
      {t("user.all-users") + ` (${total})`}
    </h2>

    <SortableTable {columnData} bind:rowData={users}>
      {#each users as user}
        <tr class="h-16 bg-base-100 hover:bg-base-300 text-sm rounded-lg">
          <td class="py-3 px-4 text-sm font-medium rounded-l-lg">
            <a
              class="underline underline-offset-2"
              href="/user-management/{user._id}"
              ><span class="break-all">{user.name ?? "-"}</span></a
            >
          </td>
          <td
            class="py-3 px-4 text-base-content text-sm font-medium"
          >
            <span class="break-all">{user.email}</span>
          </td>
          <td class="py-3 px-4 text-sm font-medium"
            >{getRoleString(user.roles)}</td
          >
          <td class="py-3 px-4 text-sm font-medium">
            {user.logins_count ?? "-"}
          </td>
          <td class="py-3 px-4 text-sm font-medium">
            {user.last_login ? formatDate(user.last_login) : "-"}
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
            {#key user?._id}
              <DropdownSection
                options={getOptions(user)}
                class={"dropdown-end"}
              />
            {/key}</td
          >
        </tr>
      {/each}
    </SortableTable>
  </div>
</div>

<!-- confirm block dialog -->
<ConfirmDialog
  bind:modal={confirmBlockModal}
  confirm={handleBlockingUser}
  title={selectedUser?.blocked
    ? t("user.un-block-confirm-message")
    : t("user.block-confirm-message")}
  description={selectedUser?.blocked
    ? t("user.un-block-description-message")
    : t("user.block-description-message")}
/>

<!-- confirm delete dialog -->
<ConfirmDialog
  bind:modal={confirmDeleteModal}
  confirm={deleteUser}
  title={t("user.delete-confirm-message")}
  description={t("user.delete-description-message")}
/>

<Loading show={loading} partial={true} />
