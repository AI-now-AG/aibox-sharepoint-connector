<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import GlobalButton from "$components/GlobalButton/GlobalButton.svelte";
  import GlobalInput from "$components/GlobalInput/GlobalInput.svelte";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import { actions } from "astro:actions";
  import { Form } from "svelte-forms-lib";
  import * as yub from "yup";
  import type { ProfileUpdateFormData } from "./types";

  export let userId: string = "";
  export let auth0Sub: string = "";
  export let name: string = "";
  export let email: string = "";
  export let organization: string = "";
  export let roles: string = "";

  const t = useTranslations();
  const formProps = {
    initialValues: {
      name,
    },
    validationSchema: yub.object({
      name: yub.string().required("Name is required"),
    }),
    onSubmit: async (values: ProfileUpdateFormData): Promise<void> => {
      try {
        await actions.auth.updateProfile.orThrow({
          ...values,
          id: userId,
          auth0Sub,
        });
        addToast({
          message: "Profile updated successfully",
          type: "success",
        });
      } catch (error) {
        addToast({
          message: "Something went wrong",
          type: "error",
        });
      }
    },
  };
</script>

<Form {...formProps}>
  <div
    class="flex sm:flex-col md:flex-row justify-between items-center pt-2 lg:pt-8 mb-5"
  >
    <h1 class="text-4xl font-bold w-full text-center sm:text-left">
      {t("profile")}
    </h1>
    <div
      class="flex sm:flex-col md:flex-row items-center sm:space-y-2 md:space-y-0 md:space-x-2 sm:w-full md:w-auto"
    >
      <GlobalButton
        label="Save"
        classes="save-button sm:w-full md:w-auto bg-indigo-600 text-white shadow-lg hover:bg-indigo-500"
        type="submit"
      />
      <GlobalButton
        label="Cancel"
        classes="sm:w-full md:w-auto text-gray-800 hover:underline"
        onClick={() => {
          window.history.back();
        }}
      />
    </div>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <GlobalInput id="name" label={t("profile.name")} value={name} />
    <GlobalInput
      id="email"
      label={t("profile.email")}
      value={email}
      disabled
      icon={svgIcons.lock}
    />
    <GlobalInput
      id="organization"
      label={t("profile.organization")}
      value={organization}
      disabled
      icon={svgIcons.lock}
    />
    <GlobalInput
      id="roles"
      label={t("profile.current-role")}
      value={roles}
      disabled
      icon={svgIcons.lock}
    />
  </div>
</Form>
