<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import Input from "$components/Input/Input.svelte";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import { actions } from "astro:actions";

  export let userId: string = "";
  export let auth0Sub: string = "";
  export let name: string = "";
  export let email: string = "";
  export let organization: string = "";
  export let roles: string = "";

  const t = useTranslations();

  function handleNameChange(event: Event) {
    name = event.detail.value;
  }

  async function handleSubmit(event: Event): Promise<void> {
    try {
      await actions.auth.updateProfile.orThrow({
        name,
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
  }
</script>

<form on:submit={handleSubmit}>
  <div
    class="flex sm:flex-col md:flex-row justify-between items-center pt-2 lg:pt-8 mb-5"
  >
    <h1 class="text-4xl font-bold w-full text-center sm:text-left">
      {t("profile")}
    </h1>
    <div
      class="flex sm:flex-col md:flex-row items-center sm:space-y-2 md:space-y-0 md:space-x-2 sm:w-full md:w-auto"
    >
      <button
        class="btn save-button sm:w-full md:w-auto bg-indigo-600 text-white shadow-lg hover:bg-indigo-500"
        type="submit"
      >
        Save
      </button>
      <button
        class="btn sm:w-full md:w-auto text-gray-800 hover:underline"
        on:click={() => {
          window.history.back();
        }}
        type="button"
      >
        Cancel
      </button>
    </div>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Input
      id="name"
      label={t("profile.name")}
      value={name}
      on:inputChange={handleNameChange}
    />
    <Input
      id="email"
      label={t("profile.email")}
      value={email}
      disabled
      icon={svgIcons.lock}
    />
    <Input
      id="organization"
      label={t("profile.organization")}
      value={organization}
      disabled
      icon={svgIcons.lock}
    />
    <Input
      id="roles"
      label={t("profile.current-role")}
      value={roles}
      disabled
      icon={svgIcons.lock}
    />
  </div>
</form>
