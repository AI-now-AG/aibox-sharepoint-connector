<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { tenant, user } from "$stores";
  import { EventName } from "$types/Posthog";
  import { posthogClientCapture } from "$utils/posthogClient";

  const t = useTranslations();

  interface Props {}
  let {}: Props = $props();

  function captureLogout() {
    posthogClientCapture($tenant, EventName.AiboxLogout, {
      name: $user?.name,
      email: $user?.email,
    });
  }
</script>

<li id="logout">
  <button
    onclick={() => {
      captureLogout();
      window.location.href = "/api/logout";
    }}>{t("common.logout")}</button
  >
</li>
