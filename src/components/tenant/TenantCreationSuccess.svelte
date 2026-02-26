<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
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

  let showAdminSuccess = $state(false);
  let successTimer: ReturnType<typeof setTimeout> | null = null;

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
      const countryText = billingInfo.country
        ? t(`subscription.country.${billingInfo.country?.toLowerCase()}` as any)
        : "";

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
        ${countryText || ""}
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
      return;
    }

    // show inline success alert
    showAdminSuccess = true;

    if (successTimer) clearTimeout(successTimer);

    successTimer = setTimeout(() => {
      showAdminSuccess = false;
    }, 10000);
  }
</script>

<div
  class="container max-w-full mx-auto grid grid-cols-1 md:grid-cols-[1fr_max-content] px-14 sticky bg-base-200 top-0 z-40"
>
  <div class="w-full max-w-4xl mx-auto">
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

    <div class="mt-3 mb-8 text-center">
      <h1 class="text-3xl font-bold">
        {t("reseller.created-tenant.tenant-success-created")}
      </h1>
    </div>

    <!-- Summary Info  -->
    <div class="p-5 mb-8 bg-base-100 rounded-lg">
      <h3 class="text-2xl font-bold mb-3">
        {t("reseller.created-tenant.summary")}
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-12 mb-8 gap-10 space-x-8">
        <div class="col-span-12 2xl:col-span-6">
          <p class="text-xs text-base-content/60 font-bold">
            {t("reseller.created-tenant.organization")}
          </p>
          <p>{organizationName}</p>
        </div>
        <div class="col-span-12 2xl:col-span-6">
          <p class="text-xs text-base-content/60 font-bold">
            {t("reseller.created-tenant.subscription")}
          </p>
          <p>{subscription}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-10 space-x-8">
        <div class="col-span-12 2xl:col-span-6">
          <p class="text-xs text-base-content/60 font-bold">
            {t("reseller.created-tenant.address")}
          </p>
          <p>
            {@html address}
          </p>
        </div>
        <div class="col-span-12 2xl:col-span-6">
          <p class="text-xs text-base-content/60 font-bold">
            {t("reseller.created-tenant.subscription-start-date")}
          </p>
          <p>{subStartDate || "-"}</p>
        </div>
      </div>
    </div>

    <!-- Add Admin Area  -->
    <div class="p-5 mb-8 bg-base-100 rounded-lg">
      <h3 class="text-2xl font-bold mb-3">
        {t("reseller.created-tenant.create-admin")}
      </h3>
      <p>
        {t("reseller.created-tenant.create-admin-description")}
      </p>

      <div class="flex max-w-2xl my-8 gap-4">
        <label class="input input-bordered w-full">
          {@html svgIcons.inputEmailIcon}
          <input
            type="text"
            class="font-medium"
            placeholder={t("reseller.created-tenant.email-placeholder")}
            bind:value={adminEmail}
          />
        </label>

        <button
          class="btn btn-primary font-normal grow-0 w-auto"
          disabled={!isFormValid}
          onclick={createAdmin}
        >
          {@html svgIcons.add}
          {t("reseller.created-tenant.invite")}
        </button>
      </div>

      <div class="flex gap-1">
        <span class="inline-flex w-4 h-4 text-base-content/60"
          >{@html svgIcons.toastInfo}</span
        >
        <p class="text-xs text-base-content/60">
          {t("reseller.created-tenant.create-admin-notes")}
        </p>
      </div>
    </div>

    <!-- Confirmation  -->
    {#if showAdminSuccess}
      <div transition:fade class="p-5 mb-8 bg-base-100 rounded-lg">
        <h4 class="text-2xl font-bold mb-2">
          {t("reseller.created-tenant.admin-user")}
        </h4>
        <div
          role="alert"
          class="alert alert-vertical sm:alert-horizontal bg-warning/30 mb-2"
        >
          <div class="text-warning">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-warning-content font-bold">
              {t("reseller.created-tenant.status-sent")}
            </h3>
            <div class="text-xs">
              <strong>{t("reseller.created-tenant.invitation-sent")}</strong>
              <p>
                {t("reseller.created-tenant.registered-success")}
              </p>
            </div>
          </div>
        </div>

        <p class="text-xs text-base-content/60">
          {t("reseller.created-tenant.invitation-notes")}
        </p>
      </div>
    {/if}
  </div>
</div>

<Loading show={loading} />
