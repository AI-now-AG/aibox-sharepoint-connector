<script lang="ts">
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import Input from "$components/Input/Input.svelte";

  interface Props {
    name?: string;
    email?: string;
    organization?: string;
    roles?: string;
  }

  let {
    name = $bindable(""),
    email = "",
    organization = "",
    roles = ""
  }: Props = $props();

  const t = useTranslations();

  function preventDefault(fn) {
		return function (event) {
			event.preventDefault();
			fn.call(this, event);
		};
	}

  function handleNameChange(event: any) {
    name = event.value;
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

<form
  onsubmit={preventDefault(handleSubmit)}
  class="container max-w-5xl mx-auto"
>
  <div class="flex flex-row justify-between items-center mb-5">
    <h1 class="text-4xl font-bold w-full text-left">
      {t("profile")}
    </h1>
    <div class="flex flex-row space-x-2">
      <button class="btn btn-primary save-button shadow-lg" type="submit">
        Save
      </button>
      <button
        class="btn sm:w-full md:w-auto"
        onclick={() => {
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
      inputChange={handleNameChange}
      required
    />
    <Input
      id="email"
      label={t("profile.email")}
      value={email}
      disabled
      icon={svgIcons.Lock}
    />
    <Input
      id="organization"
      label={t("profile.organization")}
      value={organization}
      disabled
      icon={svgIcons.Lock}
    />
    <Input
      id="roles"
      label={t("profile.current-role")}
      value={roles}
      disabled
      icon={svgIcons.Lock}
    />
  </div>
</form>
