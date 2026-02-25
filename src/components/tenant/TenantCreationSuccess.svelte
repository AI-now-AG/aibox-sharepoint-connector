<script lang="ts">
  import { actions } from "astro:actions";
  import { useTranslations } from "$i18n/utils";
  import { isValidEmail } from "$utils/common";
  import { svgIcons } from "$assets/icons";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import InputDialog from "$components/InputDialog.svelte";

  interface Props {
    tenantId: string;
  }
  let { tenantId }: Props = $props();

  const t = useTranslations();

  let loading = $state(false);
  let adminEmail = $state("");
  let addAdminModal: HTMLDialogElement | undefined = $state();
  let errorMessage = $state("");

  async function createAdmin() {
    loading = true;
    const { data, error } = await actions.tenant.createAdminUser({
      _id: tenantId,
      email: adminEmail,
      role: "admin",
    });

    loading = false;
    adminEmail = "";

    if (error) {
      addToast({
        message: `${t("tenant.create-tenant-admin-failed")} - ${error.toString()}`,
        type: "success",
      });
    } else {
      addToast({
        message: t("tenant.create-tenant-admin-successful"),
        type: "success",
      });
    }
  }
</script>

<div
  class="container max-w-full mx-auto grid grid-cols-1 md:grid-cols-[1fr_max-content] px-14 sticky bg-base-200 top-0 z-40"
>
  <div class="max-w-5xl mx-auto py-16 text-center">
    <div class="flex flex-col items-center my-8">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="48px"
        width="48px"
        viewBox="0 -960 960 960"
        fill="#00d390"
        ><path
          d="m423-329 277-277-43-43-234 234-121-121-42 42 163 165ZM180-120q-24.75 0-42.37-17.63Q120-155.25 120-180v-600q0-24.75 17.63-42.38Q155.25-840 180-840h205q5-35 32-57.5t63-22.5q36 0 63 22.5t32 57.5h205q24.75 0 42.38 17.62Q840-804.75 840-780v600q0 24.75-17.62 42.37Q804.75-120 780-120H180Zm0-60h600v-600H180v600Zm324.5-627.5Q515-818 515-832t-10.5-24.5Q494-867 480-867t-24.5 10.5Q445-846 445-832t10.5 24.5Q466-797 480-797t24.5-10.5ZM180-180v-600 600Z"
        /></svg
      >
      <p>Tenant created successfully. You can now create an admin account.</p>
    </div>
    <button
      class="btn btn-primary font-normal grow-0 w-auto"
      onclick={() => {
        addAdminModal?.show();
      }}
    >
      {@html svgIcons.add}
      {t("tenant.add-tenant-admin")}
    </button>
  </div>
</div>

<InputDialog
  bind:modal={addAdminModal}
  bind:value={adminEmail}
  bind:errorMessage
  title={t("tenant.add-tenant-admin")}
  label={t("login.email")}
  save={(value: string) => {
    if (!isValidEmail(value)) {
      errorMessage = t("tenant.email-invalid");
    } else {
      errorMessage = "";
      addAdminModal?.close();
      createAdmin();
    }
  }}
/>
<Loading show={loading} />
