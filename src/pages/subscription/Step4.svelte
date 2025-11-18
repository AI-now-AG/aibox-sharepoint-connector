<script lang="ts">
  import { actions } from "astro:actions";
  import SubsciptionSteps from "$components/subscription/SubsciptionSteps.svelte";
  import { useTranslations } from "$i18n/utils";
  import { onMount } from "svelte";
  import RadarLoading from "./RadarLoading.svelte";
  import subscription from "$stores/subscription";
  import { SubscriptionPackageId, AudioOptionId } from "$types/Subscription";
  import { isTrulyEmpty } from "$utils/common";
  import { EventName, ScreenName } from "$types/Posthog";
  import { posthogClientCaptureWithoutTenant } from "$utils/posthogClient";

  interface Props {
    defaultLanguage?: string;
  }
  let { defaultLanguage = "en" }: Props = $props();
  const t = useTranslations(defaultLanguage);

  let errorMessage = $state("");

  async function createOrganization() {
    const { data, error } = await actions.onboarding.createOrganization({
      organization_name: $subscription.organizationInfo?.organizationName ?? "",
    });

    if (error) throw new Error(t("subscription.create-organization-failed"));
    return data;
  }

  async function createMember(organizationId: string) {
    const { data, error } = await actions.onboarding.createMember({
      org_id: organizationId,
    });

    if (error) throw new Error(t("subscription.create-memeber-failed"));
    return data;
  }

  async function setupTenantData(
    organizationId: string,
    organizationName: string,
  ) {
    const { data, error } = await actions.onboarding.setupTenantData({
      name: $subscription.organizationInfo?.organizationName ?? "",
      org_id: organizationId,
      org_name: organizationName,
      language: $subscription.organizationInfo?.defaultLanguage ?? "",
      plan_name: $subscription.plan?.id as SubscriptionPackageId,
      add_ons: $subscription.audioOptions?.map(
        (option) => option.id as AudioOptionId,
      ),
      billing_method: $subscription.billingInfo?.billingMethod,
      billing_info: {
        company_name: $subscription.billingInfo?.companyName ?? "",
        address: $subscription.billingInfo?.street ?? "",
        zip_code: $subscription.billingInfo?.zipCode ?? "",
        location: $subscription.billingInfo?.location ?? "",
        email: $subscription.billingInfo?.billingEmail ?? "",
      },
      use_cases: $subscription.organizationInfo?.useCases ?? [],
      stripe_customer_id: $subscription.stripeCheckout?.customerId ?? "",
    });

    if (error) throw new Error(t("subscription.setup-tenant-data-failed"));
    return data;
  }

  async function finalizeSubscription(newTenantId: string) {
    const { data, error } = await actions.onboarding.finalize({
      tenant_id: newTenantId,
    });

    if (error) throw new Error(t("subscription.finalize-subsciption-failed"));
    return data;
  }

  async function runOnboardingFlow() {
    try {
      if (
        isTrulyEmpty($subscription.plan) ||
        isTrulyEmpty($subscription.billingInfo) ||
        isTrulyEmpty($subscription.organizationInfo)
      ) {
        throw new Error(t("subscription.missing-subscription-information"));
      }

      // Step 1: Create Organization
      const organization = await createOrganization();

      // Step 2: Create Member
      await createMember(organization.id);

      // Step 3: Setup Tenant
      const tenant = await setupTenantData(organization.id, organization.name);

      // Step 4: Finalize
      await finalizeSubscription(tenant.id);

      // After successful subscription creation, reset the subscription store
      $subscription = {};

      posthogClientCaptureWithoutTenant(EventName.AiboxOnboardingCompleted, {
        page_name: ScreenName.OnboardingCompleted,
      });

      // All steps successful, redirect
      window.location.href = "/subscription/complete";
    } catch (err) {
      errorMessage =
        (err as Error)?.message ||
        err?.toString() ||
        "Something went wrong. Please try again.";
      $subscription = {};
    }
  }

  onMount(() => {
    runOnboardingFlow();
  });
</script>

<div
  class="max-w-5xl mx-auto flex flex-col justify-center items-center min-h-full relative"
>
  <div
    class="bg-[#491EFF] p-4 rounded-lg mb-6 flex md:hidden lg:hidden items-center justify-center absolute top-0"
  >
    <SubsciptionSteps currentStep={4} {defaultLanguage} />
  </div>
  {#if errorMessage}
    <div
      class="bg-red-500 w-[80px] h-[80px] rounded-full flex justify-center items-center mb-6"
    >
      <span class="text-white text-4xl pb-2"> x </span>
    </div>
    <p class="font-sans text-3xl font-bold text-red-500 text-center">
      {errorMessage}
    </p>
  {:else}
    <div
      class="w-[40px] h-[40px] absolute left-[50%] top-[42%] translate-[-50%] flex flex-col justify-center mb-6"
    >
      <RadarLoading />
    </div>
    <p class="font-sans text-3xl font-bold text-[#0F172A] text-center">
      {t("subscription.creating-your-account")}
    </p>
  {/if}
</div>
