<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<script>
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import AlertDialog from "$components/AlertDialog.svelte";
  import { clickOutside } from "$components/actions/ClickOutside.svelte";
  import {
    trimInput,
    toLowerCase,
    replaceSpecialChars,
  } from "$components/actions/Input.svelte";
  import { loading, showLoading, hideLoading } from "$stores";

  const t = useTranslations();

  export let user;

  let confirmUpdateModal;
  let alertModal;
  let alertMessage = "";

  const MODE = {
    Create: "create",
    Edit: "edit",
  };
  // mode
  let mode = user == undefined ? MODE.Create : MODE.Edit;
  let userData = user == undefined ? {} : user;

  function validateForm() {
    return true;
  }

  async function createUser() {
    if (validateForm()) {
      try {
        showLoading();
        hideLoading();
      } catch (error) {
        showAlert(error);
      }
    }
  }

  async function updateUser() {
    if (validateForm()) {
      try {
        showLoading();
        hideLoading();
      } catch (error) {
        showAlert(error);
      }
    }
  }

  function showAlert(message) {
    alertMessage = message;
    alertModal.show();
  }
</script>

<div
  class="container max-w-full mx-auto grid grid-cols-1 md:grid-cols-[1fr_max-content] px-14 sticky bg-base-200 top-0 z-10"
>
  <div class="flex items-center pt-5 pb-2">
    <button class="mr-4" onclick="window.history.back();">
      {@html svgIcons.back}
    </button>
    <h1 class="text-4xl font-bold">
      {mode == MODE.Create ? t("user.add-new-user") : userData.name}
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
      <button class="btn" onclick="window.history.back();">
        {t("common.cancel")}
      </button>
    </div>
  </div>
</div>
<div class="px-8 mb-10">
  <div class="container w-full mx-auto p-6">
    <ConfirmDialog
      title={t("user.update-confirm-message")}
      bind:modal={confirmUpdateModal}
      on:confirm={updateUser}
    />

    <AlertDialog bind:modal={alertModal} message={alertMessage} />
  </div>
</div>

<Loading bind:show={$loading} />
