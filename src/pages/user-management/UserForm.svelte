<script lang="ts">
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import AlertDialog from "$components/AlertDialog.svelte";
  import { user as currentUser } from "$stores";
  import { loading, showLoading, hideLoading } from "$stores";
  import log from "$utils/log";
  import moment from "moment";
  import Input from "$components/Input/Input.svelte";
  import { isEnterpriseConnection, isValidEmail } from "$utils/common";
  import { UserRole } from "$enums/Users";

  const t = useTranslations();
  interface Props {
    user: any;
    tenant: any;
  }
  let { user, tenant }: Props = $props();

  const MODE = {
    Create: "create",
    Edit: "edit",
  };
  let mode = user ? MODE.Edit : MODE.Create;
  const headerTitle =
    mode == MODE.Create
      ? t("user.add-new-user")
      : (user?.name ?? t("common.edit"));

  let confirmUpdateModal: HTMLDialogElement | undefined = $state();
  let confirmBlockModal: HTMLDialogElement | undefined = $state();
  let confirmDeleteModal: HTMLDialogElement | undefined = $state();

  let alertModal: HTMLDialogElement | undefined = $state();
  let alertMessage = $state("");

  let userData = $state(user ?? {});

  let isEnterpriseAuth = $state(false);
  let isUpdateRoleDisabled = $state(false);

  const isRestrictUserManagment = tenant.is_restrict_user_managment;

  // Important note: User created on Auth0 with super admin , just the Admin on AI box when go into the detail screen
  let role = $state(UserRole.User);
  function getUserRole(roles: string[] = []) {
    return roles?.some(
      (role) => role === UserRole.SuperAdmin || role === UserRole.Admin,
    )
      ? UserRole.Admin
      : UserRole.User;
  }

  function isSuperAdmin(roles: string[] = []): boolean {
    return roles?.some((role) => role === UserRole.SuperAdmin);
  }

  onMount(() => {
    if (mode == MODE.Create && tenant && isRestrictUserManagment) {
      window.history.back();
      return;
    }
    if (isSuperAdmin(userData.roles)) {
      isUpdateRoleDisabled = true;
      role = UserRole.SuperAdmin;
    } else {
      role = getUserRole(userData.roles);
    }
    isEnterpriseAuth = isEnterpriseConnection(userData?.auth0_sub);
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

  function validateForm() {
    if (!userData.name) {
      showAlert(t("user.validate-empty-name-message"));
      return false;
    }

    if (!userData.email) {
      showAlert(t("user.validate-emapty-email-message"));
      return false;
    }

    if (!isValidEmail(userData.email)) {
      showAlert(t("user.validate-wrong-email-message"));
      return false;
    }
    return true;
  }

  async function createUser() {
    if (validateForm()) {
      try {
        showLoading();
        userData = { ...userData, roles: [role] };
        const { error } = await actions.user.create(userData);
        hideLoading();
        if (error) {
          showAlert(error);
        } else {
          addToast({
            message: t("user.create-successful"),
            type: "success",
          });
          window.location.href = "/user-management";
        }
      } catch (error) {
        showAlert(error);
      }
    }
  }

  async function updateUser() {
    if (validateForm()) {
      try {
        showLoading();
        userData = { ...userData, roles: [role] };
        const { error } = await actions.user.update(userData);
        hideLoading();
        if (error) {
          showAlert(error);
        } else {
          addToast({
            message: t("user.update-successful"),
            type: "success",
          });
          window.location.href = "/user-management";
        }
      } catch (error) {
        showAlert(error);
      }
    }
  }

  function showAlert(message: any) {
    alertMessage = message;
    alertModal?.show();
  }

  async function handleBlockingUser() {
    showLoading();
    const { _id = "", blocked } = userData;
    const result = await actions.user.updateBlocked({
      _id,
      blocked: !blocked,
    });

    hideLoading();
    const { error } = result;
    log.d(result, "updateUserStatus result");
    if (!error) {
      userData.blocked = !blocked;
      addToast({
        message: blocked
          ? t("user.un-block-successful")
          : t("user.block-successful"),
        type: "success",
      });
    } else {
      log.e(error, "Error updating user status");
      addToast({
        message: blocked ? t("user.un-block-failed") : t("user.block-failed"),
        type: "error",
      });
    }
  }

  async function deleteUser() {
    const { _id = "" } = userData;
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
      window.history.back();
    } else {
      log.e(error, "Error deleting user");
      addToast({
        message: t("user.delete-failed"),
        type: "error",
      });
    }
  }
</script>

<div
  class="container max-w-full mx-auto grid grid-cols-1 md:grid-cols-[1fr_max-content] px-14 sticky bg-base-200 top-0 z-10 font-sans"
>
  <div class="flex items-center pt-5 pb-2">
    <button
      class="mr-4"
      onclick={() => {
        window.history.back();
      }}
    >
      {@html svgIcons.back}
    </button>
    <h1 class="text-4xl font-bold">
      {headerTitle}
    </h1>

    <div class="flex space-x-2 ml-auto">
      <button
        class="btn btn-primary"
        onclick={() => {
          mode == MODE.Edit ? confirmUpdateModal?.show() : createUser();
        }}
      >
        {t("common.save")}
      </button>
      <button
        class="btn"
        onclick={() => {
          window.history.back();
        }}
      >
        {t("common.cancel")}
      </button>
    </div>
  </div>
</div>
<div class="px-8 mb-10">
  <div class="container w-full mx-auto p-6">
    <div class="flex flex-row space-x-4">
      <div class="flex-1 flex flex-col mb-4">
        <Input
          id="name"
          label={t("common.name")}
          value={userData.name ?? ""}
          placeholder={t("common.name")}
          inputChange={(event: any) => {
            userData.name = event.value;
          }}
          disabled={isEnterpriseAuth}
          required
        />
      </div>

      <div class="flex-1 flex flex-col mb-4">
        <Input
          id="email"
          label={t("user.e-mail")}
          value={userData.email ?? ""}
          placeholder={t("user.e-mail")}
          inputChange={(event: any) => {
            userData.email = event.value;
          }}
          disabled={isEnterpriseAuth || isRestrictUserManagment}
          required
        />
      </div>
    </div>

    <div class="">
      <div class="mb-5 text-gray-400 font-medium text-sm">{t("user.role")}</div>

      <div class="flex items-center">
        <div class="flex items-center">
          <input
            type="radio"
            id="role-admin"
            name="role"
            class="radio radio-primary"
            value={UserRole.Admin}
            checked={role == UserRole.Admin || role == UserRole.SuperAdmin}
            onchange={() => {
              role = UserRole.Admin;
            }}
            disabled={isUpdateRoleDisabled}
          />
          <label for="role-admin" class="ml-2 font-medium text-sm"
            >{t("user.admin")}</label
          >
        </div>
        <div class="flex items-center ml-8">
          <input
            type="radio"
            id="role-user"
            name="role"
            class="radio radio-primary"
            value={UserRole.User}
            checked={role == UserRole.User}
            onchange={() => {
              role = UserRole.User;
            }}
            disabled={isUpdateRoleDisabled}
          />
          <label for="role-user" class="ml-2 font-medium text-sm"
            >{t("user.user")}</label
          >
        </div>
      </div>

      {#if mode == MODE.Edit}
        <div class="w-full h-[1px] bg-slate-200 mt-8 mb-8"></div>

        <div class="w-full mb-4 font-medium text-base text-[#0F172A]">
          {t("user.additional-infos")}
        </div>
        <div class="flex flex-row space-x-4 text-sm">
          <div class="flex-1 flex flex-col mb-4">
            <table
              class="border-separate border-spacing-x-0 border-spacing-y-3"
            >
              <colgroup>
                <col class="w-36" />
                <col class="w-auto" />
              </colgroup>
              <tbody>
                <tr class="mb-4">
                  <td class="text-gray-400">{t("user.signed-up")}</td>
                  <td class="text-base">
                    {moment(userData.created_at, "DD.MM.YYYY").format(
                      "dddd DD.MM.YYYY",
                    )}</td
                  >
                </tr>
                <tr class="mb-4">
                  <td class="text-gray-400">{t("user.logins")}</td>
                  <td class="text-base">{userData.logins_count ?? "-"}</td>
                </tr>
                <tr class="">
                  <td class="text-gray-400">{t("user.organization")}</td>
                  <td class="text-base">{tenant?.name ?? "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex-1 flex flex-col mb-4">
            <table
              class="border-separate border-spacing-x-0 border-spacing-y-3"
            >
              <colgroup>
                <col class="w-36" />
                <col class="w-auto" />
              </colgroup>
              <tbody>
                <tr class="mb-4">
                  <td class="text-gray-400">{t("user.latest-login")}</td>
                  <td class="text-base">
                    {userData.last_login
                      ? moment(userData.last_login).format("dddd DD.MM.YYYY")
                      : "-"}
                  </td>
                </tr>
                <tr class="mb-4">
                  <td class="text-gray-400">{t("user.status")}</td>
                  <td
                    class="text-base"
                    style={`color: ${getUserStatus(userData.blocked, userData.email_verified).color}`}
                  >
                    {getUserStatus(userData.blocked, userData.email_verified)
                      .text}</td
                  >
                </tr>
                <tr class="mb-4">
                  <td class="text-gray-400">{t("user.id")}</td>
                  <td class="text-base"> {userData.auth0_sub}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="w-full h-[1px] bg-slate-200 mt-2 mb-8"></div>

        {#if userData.email != $currentUser?.email && !isRestrictUserManagment}
          <div class="flex items-center">
            <button
              class="flex items-centertext-gray-700 font-sans"
              onclick={(e) => {
                confirmBlockModal?.show();
              }}
            >
              <span class="w-5 h-5 flex items-center">
                {@html svgIcons.block}</span
              >
              <span class="text-sm font-semibold ml-1 text-left"
                >{userData.blocked
                  ? t("user.un-block-user")
                  : t("user.block-user")}</span
              >
            </button>

            <button
              class="flex items-center font-sans text-red-600 ml-8"
              onclick={(e) => {
                confirmDeleteModal?.show();
              }}
            >
              <span class="w-5 h-5 flex items-center">
                {@html svgIcons.trash}</span
              >
              <span class="text-sm font-semibold ml-1 text-left text-red-600"
                >{t("user.delete-user")}</span
              >
            </button>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<!-- confirm update dialog -->
<ConfirmDialog
  bind:modal={confirmUpdateModal}
  confirm={updateUser}
  title={t("user.update-confirm-message")}
/>

<!-- confirm block dialog -->
<ConfirmDialog
  bind:modal={confirmBlockModal}
  confirm={handleBlockingUser}
  title={userData?.blocked
    ? t("user.un-block-confirm-message")
    : t("user.block-confirm-message")}
  description={userData?.blocked
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

<AlertDialog bind:modal={alertModal} bind:message={alertMessage} />

<Loading bind:show={$loading} />
