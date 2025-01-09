<script lang="ts">
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import Input from "$components/Input/Input.svelte";

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

<form on:submit|preventDefault={handleSubmit} class="container max-w-5xl mx-auto">
  <div
    class="flex flex-row justify-between items-center mb-5"
  >
    <h1 class="text-4xl font-bold w-full text-left ">
      {t("profile")}
    </h1>
    <div
      class="flex flex-row space-x-2"
    >
      <button
        class="btn btn-primary save-button shadow-lg"
        type="submit"
      >
        Save
      </button>
      <button
        class="btn sm:w-full md:w-auto"
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
      required
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
