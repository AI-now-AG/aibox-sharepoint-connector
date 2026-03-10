<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { actions } from "astro:actions";
  import { useTranslations } from "$i18n/utils";
  import { isValidEmail } from "$utils/validation";
  import { getSubscriptionAddOnName } from "$utils/subscription";
  import { svgIcons } from "$assets/icons";
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

  let showAdminError = $state(false);
  let showAdminSuccess = $state(false);

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
    showAdminSuccess = false;
    showAdminError = false;

    const { data, error } = await actions.tenant.createAdminUser({
      _id: tenantId,
      email: adminEmail,
      role: "admin",
    });

    loading = false;
    adminEmail = "";

    if (error) {
      showAdminError = true;
      console.warn(
        `${t("tenant.create-tenant-admin-failed")} - ${error.toString()}`,
      );
      return;
    }

    // show inline success alert
    showAdminSuccess = true;
  }
</script>

<div
  class="container max-w-full mx-auto grid grid-cols-1 md:grid-cols-[1fr_max-content] px-14 sticky bg-base-200 top-0 z-40"
>
  <div class="w-full max-w-4xl mx-auto">
    <div class="flex flex-col items-center">
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="80" height="80" rx="40" fill="#DCFCE7" />
        <path
          d="M37.05 50.2L51.9 35.35L47.75 31.15L37.05 41.85L31.95 36.75L27.8 40.95L37.05 50.2ZM40 61.7C36.9667 61.7 34.1335 61.1319 31.5006 59.9958C28.8677 58.8597 26.5774 57.3178 24.6298 55.3702C22.6822 53.4226 21.1403 51.1323 20.0042 48.4994C18.868 45.8665 18.3 43.0333 18.3 40C18.3 36.9667 18.868 34.1335 20.0042 31.5006C21.1403 28.8677 22.6822 26.5774 24.6298 24.6298C26.5774 22.6822 28.8677 21.1403 31.5006 20.0042C34.1335 18.8681 36.9667 18.3 40 18.3C43.0333 18.3 45.8664 18.8681 48.4994 20.0042C51.1323 21.1403 53.4225 22.6822 55.3702 24.6298C57.3178 26.5774 58.8597 28.8677 59.9958 31.5006C61.1319 34.1335 61.7 36.9667 61.7 40C61.7 43.0333 61.1319 45.8665 59.9958 48.4994C58.8597 51.1323 57.3178 53.4226 55.3702 55.3702C53.4225 57.3178 51.1323 58.8597 48.4994 59.9958C45.8664 61.1319 43.0333 61.7 40 61.7ZM40 55.4C44.3333 55.4 47.9833 53.9167 50.95 50.95C53.9167 47.9833 55.4 44.3333 55.4 40C55.4 35.6667 53.9167 32.0167 50.95 29.05C47.9833 26.0833 44.3333 24.6 40 24.6C35.6667 24.6 32.0167 26.0833 29.05 29.05C26.0833 32.0167 24.6 35.6667 24.6 40C24.6 44.3333 26.0833 47.9833 29.05 50.95C32.0167 53.9167 35.6667 55.4 40 55.4Z"
          fill="#16A34A"
        />
      </svg>
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

      <!-- Confirmation && Error Handling  -->
      {#if showAdminSuccess}
        <div transition:fade class="mt-5">
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
        </div>
      {/if}
      {#if showAdminError}
        <div class="alert alert-warning mt-6 animate-fade-in">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>{t("reseller.created-tenant.user-reached-limit")}</span>
          <div class="ml-auto">
            <button
              class="btn btn-sm btn-ghost btn-circle"
              onclick={() => (showAdminError = false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<Loading show={loading} />
