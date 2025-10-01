<script lang="ts">
  import { actions } from "astro:actions";
  import Loading from "$components/Loading.svelte";
  import { getLanguage, useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import {
    SubscriptionPackageId,
    AudioOptionId,
    BillingMethod,
  } from "$types/Subscription";
  import { tenant } from "$stores";
  import { SubscriptionPackages } from "$data/subscription-packages";

  interface Props {
    planName: SubscriptionPackageId | undefined;
    addOns: AudioOptionId[] | undefined;
    billingMethod?: string;
    billingInfo?: Record<string, any> | undefined;
  }

  let { planName, addOns = [], billingMethod, billingInfo }: Props = $props();
  const { plan, audioOptions } = SubscriptionPackages;

  let totalPrice: any = $state("");

  const lang = (getLanguage() as "en" | "de") || "en";
  const t = useTranslations();
  let loading = $state(false);

  // Calculate total price (include package and audio options)
  $effect(() => {
    let packagePrice = 0;
    let audioOptionsTotalPrice = 0;

    // Get package price
    if (planName) {
      let selectedPackage =
        SubscriptionPackages.plan[
          planName as keyof typeof SubscriptionPackages.plan
        ];
      if (selectedPackage) {
        packagePrice = selectedPackage?.price || 0;
      }
    }

    // Get audio options price
    if (addOns.length > 0) {
      addOns.forEach((audioOptionId) => {
        let audioOption =
          SubscriptionPackages.audioOptions[
            audioOptionId as keyof typeof SubscriptionPackages.audioOptions
          ];
        if (audioOption) {
          audioOptionsTotalPrice += audioOption?.price || 0;
        }
      });
    }

    totalPrice = packagePrice + audioOptionsTotalPrice;
  });

  async function goToBillingPortal() {
    loading = true;
    const { error, data } = await actions.tenant.stripeBillingPortal({
      customer_id: $tenant?.stripe_customer_id as string,
      return_url: window.location.href,
    });

    loading = false;
    if (error) {
      addToast({
        message: error?.message ?? "Something went wrong",
        type: "error",
      });
    } else {
      window.location.href = data.url;
    }
  }
</script>

<div role="alert" class="alert alert-info inline-flex">
  <span>{@html t("settings.subscription.description")}</span>
</div>

<div class="flex flex-col space-y-2 py-8">
  <h3 class="mb-3 text-xl font-bold">
    {t("settings.subscription.current-plan")}
  </h3>

  {#each Object.values(plan).filter((p) => p.id == planName) as planItem}
    <p>{planItem?.name?.[lang]} CHF {planItem?.price}.-</p>
  {/each}

  {#each addOns as addOnName}
    <p>
      {audioOptions?.[addOnName]?.name?.[lang]} CHF {audioOptions?.[addOnName]
        ?.price}.-
    </p>
  {/each}
   <p class="font-bold mt-4">
      {t("subscription.total-price-for-plan", { total: totalPrice })}
    </p>
</div>

<div class="flex flex-col space-y-2 py-8">
  <h3 class="mb-3 text-xl font-bold">{t("settings.subscription.billing")}</h3>
  <div class="grid grid-cols-1 lg:grid-cols-2 space-y-4">
    <div class="space-y-2">
      <p>
        <strong>{t("subscription.company-name")}: </strong>
        {billingInfo?.company_name ?? "-"}
      </p>
      <p>
        <strong>{t("subscription.street-number")}: </strong>
        {billingInfo?.address ?? "-"}
      </p>
      <p>
        <strong>{t("subscription.zip-code")}: </strong>
        {billingInfo?.zip_code ?? "-"}
      </p>
      <p>
        <strong>{t("subscription.location")}: </strong>
        {billingInfo?.location ?? "-"}
      </p>
      <p>
        <strong>{t("subscription.billing-email")}: </strong>
        {billingInfo?.email ?? "-"}
      </p>
    </div>
    <div>
      {#if billingMethod === BillingMethod.CreditCard}
        <button
          class="btn btn-sm btn-primary px-10 self-start font-medium"
          onclick={goToBillingPortal}
        >
          {t("subscription.biliing-details")}
        </button>
      {/if}
    </div>
  </div>
</div>

<Loading show={loading} />
