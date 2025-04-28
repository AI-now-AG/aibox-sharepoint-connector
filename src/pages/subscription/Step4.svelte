<script lang="ts">
  import { actions } from "astro:actions";
  import SubsciptionSteps from "$components/subscription/SubsciptionSteps.svelte";
  import { useTranslations } from "$i18n/utils";
  import { onMount } from "svelte";
  import { addToast } from "$stores/toast";
  import RadarLoading from "./RadarLoading.svelte";
  import subscription from "$stores/subscription";
  import { SubscriptionPackageId, AudioOptionId } from "$types/Subscription";
  import { isTrulyEmpty } from "$utils/common";

  interface Props {
    user: any;
  }
  let { user } = $props() as Props;

  const t = useTranslations();

  async function createOrganization() {
    const { data, error } = await actions.onboarding.createOrganization({
      company_name: $subscription.billingInformation?.companyName ?? "",
    });

    if (error) throw new Error("Failed to create organization");
    return data;
  }

  async function createMember(organizationId: string) {
    const { data, error } = await actions.onboarding.createMember({
      org_id: organizationId,
    });

    if (error) throw new Error("Failed to create member");
    return data;
  }

  async function setupTenantData(
    organizationId: string,
    organizationName: string,
  ) {
    const { data, error } = await actions.onboarding.setupTenantData({
      name: $subscription.organizationInformation?.companyName ?? "",
      org_id: organizationId,
      org_name: organizationName,
      language: $subscription.organizationInformation?.defaultLanguage ?? "",
      plan_name: $subscription.plan?.id as SubscriptionPackageId,
      add_ons: $subscription.audioOptions?.map(
        (option) => option.id as AudioOptionId,
      ),
      billing: {
        company_name: $subscription.billingInformation?.companyName ?? "",
        address: $subscription.billingInformation?.street ?? "",
        zip_code: $subscription.billingInformation?.zipCode ?? "",
        location: $subscription.billingInformation?.location ?? "",
        email: $subscription.billingInformation?.billingEmail ?? "",
      },
      use_cases: $subscription.organizationInformation?.useCases ?? [],
    });

    if (error) throw new Error("Failed to setup tenant data");
    return data;
  }

  async function finalizeSubscription(newTenantId: string) {
    const { data, error } = await actions.onboarding.finalize({
      tenant_id: newTenantId,
    });

    if (error) throw new Error("Failed to finalize subscription");
    return data;
  }

  async function runOnboardingFlow() {
    console.log("iboxsubscription", $subscription);
    if (
      isTrulyEmpty($subscription.plan) ||
      //isTrulyEmpty($subscription.audioOptions) ||
      isTrulyEmpty($subscription.billingInformation) ||
      isTrulyEmpty($subscription.organizationInformation)
    ) {
      addToast({
        type: "error",
        message: "Oops, missing subscription information.",
      });
      return false;
    }

    try {
      // Step 1: Create organization
      const organization = await createOrganization();

      // Step 2: Create member
      await createMember(organization.id);

      // Step 3: Create member
      const tenant = await setupTenantData(organization.id, organization.name);

      // Step 4: Create member
      await finalizeSubscription(tenant.id);

      // After successful subscription creation, reset the subscription store
      $subscription = {};

      // All steps successful, redirect
      window.location.href = "/subscription/complete";
    } catch (err) {
      addToast({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
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
    <SubsciptionSteps currentStep={4} />
  </div>

  <div
    class="w-[40px] h-[40px] absolute left-[50%] top-[42%] translate-[-50%] flex flex-col justify-center mb-6"
  >
    <RadarLoading />
  </div>
  <p class="font-sans text-3xl font-bold text-[#0F172A] text-center">
    {t("subscription.creating-your-account")}
  </p>
</div>
