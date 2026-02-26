<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import { useTranslations } from "$i18n/utils";
  import { isValidEmail } from "$utils/common";
  import { getSubscriptionAddOnName } from "$utils/subscription";
  import { svgIcons } from "$assets/icons";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";

  interface Props {
    tenantId: string;
  }
  let { tenantId }: Props = $props();

  const t = useTranslations();

  let organizationName = $state("");
  let subscription = $state("");
  let address = $state("");
  let subStartDate = $state("");

  let adminEmail = $state("");
  let loading = $state(false);
  let isFormValid = $derived(adminEmail !== "" && isValidEmail(adminEmail));

  onMount(() => {
    fetchTenant();
  });

  async function fetchTenant() {
    loading = true;
    const { data } = await actions.tenant.get({
      _id: tenantId,
    });

    if (data) {
      const billingInfo = data.billing_info;
      const subscriptionInfo = data.subscription;
      const planAddOns = [subscriptionInfo.plan_name];

      if (subscriptionInfo.add_ons) {
        const audioAddOn = getSubscriptionAddOnName(
          "audiototext",
          subscriptionInfo.add_ons,
        );
        const subtitleAddOn = getSubscriptionAddOnName(
          "subtitle",
          subscriptionInfo.add_ons,
        );
        audioAddOn && planAddOns.push(audioAddOn);
        subtitleAddOn && planAddOns.push(subtitleAddOn);
      }

      organizationName = data.name;
      subscription = planAddOns.join(", ");
      address = `
        ${billingInfo.address ?? ""}<br/>
        ${billingInfo.zip_code ?? ""} ${billingInfo.location ?? ""}<br/>
        ${billingInfo.country ?? ""}<br/>
      `;
      subStartDate = subscriptionInfo.start_date ?? "";
    }

    loading = false;
  }

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
  <div class="w-full max-w-4xl mx-auto py-8">
    <div class="flex flex-col items-center">
      <div class="inline-flex px-2 py-2 bg-success/10 rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="40px"
          viewBox="0 -960 960 960"
          width="40px"
          fill="#75FB4C"
          ><path
            d="M422-297.33 704.67-580l-49.34-48.67L422-395.33l-118-118-48.67 48.66L422-297.33ZM480-80q-82.33 0-155.33-31.5-73-31.5-127.34-85.83Q143-251.67 111.5-324.67T80-480q0-83 31.5-156t85.83-127q54.34-54 127.34-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82.33-31.5 155.33-31.5 73-85.5 127.34Q709-143 636-111.5T480-80Zm0-66.67q139.33 0 236.33-97.33t97-236q0-139.33-97-236.33t-236.33-97q-138.67 0-236 97-97.33 97-97.33 236.33 0 138.67 97.33 236 97.33 97.33 236 97.33ZM480-480Z"
          /></svg
        >
      </div>
    </div>

    <div class="mt-5 mb-10 text-center">
      <h1 class="text-3xl font-bold">Kunden-Tenant erfolgreich angelegt!</h1>
    </div>

    <div class="p-5 mb-8 bg-base-100 rounded-lg">
      <h3 class="text-2xl font-bold mb-3">Summary</h3>

      <div class="grid grid-cols-1 md:grid-cols-12 mb-8 gap-10 space-x-8">
        <div class="col-span-12 2xl:col-span-6">
          <p class="text-xs text-base-content/60 font-bold">
            ORGANISATION NAME
          </p>
          <p>{organizationName}</p>
        </div>
        <div class="col-span-12 2xl:col-span-6">
          <p class="text-xs text-base-content/60 font-bold">SUBSCRIPTION</p>
          <p>{subscription}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-10 space-x-8">
        <div class="col-span-12 2xl:col-span-6">
          <p class="text-xs text-base-content/60 font-bold">ADDRESS</p>
          <p>
            {@html address}
          </p>
        </div>
        <div class="col-span-12 2xl:col-span-6">
          <p class="text-xs text-base-content/60 font-bold">
            SUBSCRIPTION START DATE
          </p>
          <p>{subStartDate || "-"}</p>
        </div>
      </div>
    </div>

    <div class="p-5 mb-8 bg-base-100 rounded-lg">
      <h3 class="text-2xl font-bold mb-3">Admin-Benutzer anlegen</h3>
      <p>
        Lade die Person ein, die diesen Account verwalten wird. Diese Person
        erhält vollen Zugriff auf alle Einstellungen.
      </p>

      <div class="flex my-8 gap-4">
        <label class="input input-bordered w-full">
          {@html svgIcons.inputEmailIcon}
          <input
            type="text"
            class="font-medium"
            placeholder="E-Mail-Adresse des Administrators"
            bind:value={adminEmail}
          />
        </label>

        <button
          class="btn btn-primary font-normal grow-0 w-auto"
          disabled={!isFormValid}
          onclick={createAdmin}
        >
          {@html svgIcons.add}
          {"Einladen"}
        </button>
      </div>

      <div class="flex gap-1">
        <span class="inline-flex w-4 h-4 text-base-content/60"
          >{@html svgIcons.toastInfo}</span
        >
        <p class="text-xs text-base-content/60">
          Der Administrator kann später weitere Benutzer und Rollen hinzufügen.
        </p>
      </div>
    </div>
  </div>
</div>

<Loading show={loading} />
