<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<script lang="ts">
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import AlertDialog from "$components/AlertDialog.svelte";
  import { tenant, user as currentUser } from "$stores";
  import { loading, showLoading, hideLoading } from "$stores";
  import log from "$utils/log";
  import moment from "moment";
  import Input from "$components/Input/Input.svelte";
  import { isValidEmail } from "$utils/common";
  import { UserRole } from "./DropdownFilter.svelte";

  const t = useTranslations();

  export let user: any;

  // List of enterprise providers
  const enterpriseProviders = [
    "saml",
    "oidc",
    "okta",
    "google",
    "waad",
    "adfs",
    "ad",
    "ping",
  ];

  let confirmUpdateModal: HTMLDialogElement;
  let confirmBlockModal: HTMLDialogElement;
  let confirmDeleteModal: HTMLDialogElement;

  let alertModal: HTMLDialogElement;
  let alertMessage: any = "";

  const MODE = {
    Create: "create",
    Edit: "edit",
  };
  let mode = user == undefined ? MODE.Create : MODE.Edit;
  let userData = user == undefined ? {} : user;

  let isEnterpriseAuthentication = false;
  let isDisbaleUpdateRole = false;

  function checkEnterpriseAuthentication() {
    const parts = userData?.user_id.split("|");
    const provider = parts[0];
    return enterpriseProviders.includes(provider);
  }

  // Important note: User created on Auth0 with super admin , just the Admin on AI box when go into the detail screen
  let role = UserRole.User;
  function getUserRole(roles: string[]) {
    for (let i = 0; i < roles?.length; i++) {
      const _role = roles[i];
      if (_role == UserRole.SuperAdmin || _role == UserRole.Admin) {
        return UserRole.Admin;
      }
    }
    return UserRole.User;
  }

  function isSuperAdmin(roles: string[]) {
    for (let i = 0; i < roles?.length; i++) {
      const _role = roles[i];
      if (_role == UserRole.SuperAdmin) {
        return true;
      }
    }
    return false;
  }

  onMount(() => {
    if (isSuperAdmin(userData.roles)) {
      isDisbaleUpdateRole = true;
      role = UserRole.SuperAdmin;
    } else {
      role = getUserRole(userData.roles);
    }
    isEnterpriseAuthentication = checkEnterpriseAuthentication();
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
        userData = { ...userData, roles: [role], tenant_id: $tenant._id };
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
    alertModal.show();
  }

  async function handleBlockingUser() {
    showLoading();
    const { _id = "", blocked } = userData;
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
      on:click={() => {
        window.history.back();
      }}
    >
      {@html svgIcons.back}
    </button>
    <h1 class="text-4xl font-bold">
      {mode == MODE.Create ? t("user.add-new-user") : user?.name}
    </h1>

    <div class="flex space-x-2 ml-auto">
      <button
        class="btn btn-primary"
        on:click={() => {
          mode == MODE.Edit ? confirmUpdateModal.show() : createUser();
        }}
      >
        {t("common.save")}
      </button>
      <button
        class="btn"
        on:click={() => {
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
          on:inputChange={(event) => {
            userData.name = event.detail.value;
          }}
          disabled={isEnterpriseAuthentication}
          required
        />
      </div>

      <div class="flex-1 flex flex-col mb-4">
        <Input
          id="email"
          label={t("user.e-mail")}
          value={userData.email ?? ""}
          placeholder={t("user.e-mail")}
          on:inputChange={(event) => {
            userData.email = event.detail.value;
          }}
          disabled={isEnterpriseAuthentication}
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
            on:change={() => {
              role = UserRole.Admin;
            }}
            disabled={isDisbaleUpdateRole}
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
            on:change={() => {
              role = UserRole.User;
            }}
            disabled={isDisbaleUpdateRole}
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
            </table>
          </div>
        </div>

        <div class="w-full h-[1px] bg-slate-200 mt-2 mb-8"></div>

        {#if userData.email != currentUser.email}
          <div class="flex items-center">
            <button
              class="flex items-centertext-gray-700 font-sans"
              on:click={(e) => {
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
              on:click={(e) => {
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

<ConfirmDialog
  title={t("user.update-confirm-message")}
  bind:modal={confirmUpdateModal}
  on:confirm={updateUser}
/>

<ConfirmDialog
  title={userData?.blocked
    ? t("user.un-block-confirm-message")
    : t("user.block-confirm-message")}
  description={userData?.blocked
    ? t("user.un-block-description-message")
    : t("user.block-description-message")}
  bind:modal={confirmBlockModal}
  on:confirm={handleBlockingUser}
/>

<ConfirmDialog
  title={t("user.delete-confirm-message")}
  description={t("user.delete-description-message")}
  bind:modal={confirmDeleteModal}
  on:confirm={deleteUser}
/>

<AlertDialog bind:modal={alertModal} message={alertMessage} />

<Loading bind:show={$loading} />
