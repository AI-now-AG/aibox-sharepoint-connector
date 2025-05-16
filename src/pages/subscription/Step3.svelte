<script lang="ts">
  import { actions } from "astro:actions";
  import Loading from "$components/Loading.svelte";
  import AlertDialog from "$components/AlertDialog.svelte";
  import Input from "$components/form/Input.svelte";
  import SubsciptionSteps from "$components/subscription/SubsciptionSteps.svelte";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import {
    storeBillingInfo,
    storeStripeCheckout,
    subscription,
  } from "$stores/subscription";
  import {
    SubscriptionPackageId,
    AudioOptionId,
    BillingMethod,
  } from "$types/Subscription";
  import { isValidEmail } from "$utils/common";

  interface Props {
    defaultLanguage?: string;
  }
  let { defaultLanguage = "en" }: Props = $props();
  const t = useTranslations(defaultLanguage);
  let loading = $state(false);

  const initBillingInfo = $subscription.billingInfo;

  let companyName = $state(initBillingInfo?.companyName ?? "");
  let street = $state(initBillingInfo?.street ?? "");
  let zipCode = $state(initBillingInfo?.zipCode ?? "");
  let location = $state(initBillingInfo?.location ?? "");
  let billingEmail = $state(initBillingInfo?.billingEmail ?? "");
  let billingMethod = $state(
    initBillingInfo?.billingMethod ?? BillingMethod.MonthlyInvoice,
  );

  let alertModal: HTMLDialogElement | undefined = $state();
  let alertMessage = $state("");

  function showAlert(message: any) {
    alertMessage = message;
    alertModal?.show();
  }

  function validateForm() {
    if (!companyName) {
      showAlert(t("subscription.validate-empty-company-name-message"));
      return false;
    }

    if (!street) {
      showAlert(t("subscription.validate-empty-street-message"));
      return false;
    }
    if (!zipCode) {
      showAlert(t("subscription.validate-empty-zip-code-message"));
      return false;
    }
    if (!location) {
      showAlert(t("subscription.validate-empty-location-message"));
      return false;
    }

    if (!isValidEmail(billingEmail)) {
      showAlert(t("subscription.validate-invalid-email-message"));
      return false;
    }
    return true;
  }

  async function createStripeSession() {
    const { data, error } = await actions.onboarding.createStripeSession({
      plan_name: $subscription.plan?.id as SubscriptionPackageId,
      add_ons: $subscription.audioOptions?.map(
        (option) => option.id as AudioOptionId,
      ),
      billing_info: {
        company_name: companyName,
        address: street,
        zip_code: zipCode,
        location: location,
        email: billingEmail,
      },
      language: $subscription.organizationInfo?.defaultLanguage,
    });

    if (error) {
      addToast({
        message: "Something went wrong",
        type: "error",
      });
      return null;
    }

    return data;
  }

  async function handleNext() {
    if (validateForm()) {
      storeBillingInfo({
        companyName,
        street,
        zipCode,
        location,
        billingEmail,
        billingMethod,
      });

      if (
        $subscription.billingInfo?.billingMethod == BillingMethod.CreditCard
      ) {
        loading = true;
        const result = await createStripeSession();
        loading = false;

        if (result) {
          storeStripeCheckout({
            customerId: result.stripeCustomerId,
          });
          window.location.href = result.url;
        }
      } else {
        window.location.href = "/subscription/step4";
      }
    }
  }
</script>

<div class="max-w-5xl mx-auto">
  <div
    class="bg-[#491EFF] p-4 rounded-lg mb-6 flex md:hidden lg:hidden items-center justify-center"
  >
    <SubsciptionSteps currentStep={3} {defaultLanguage} />
  </div>

  <h1 class="font-sanns text-3xl font-bold text-black mt-2">
    {t("subscription.provide-billing-information")}
  </h1>
  <p class="font-sans text-base font-medium text-gray-600 mt-6 mb-10">
    {t("subscription.provide-billing-information-description")}
  </p>

  <!-- Form -->
  <div class="w-full mx-auto">
    <div
      class="block md:flex lg:flex flex-row md:space-x-8 space-x-0 lg:space-x-8"
    >
      <div class="flex-1 flex flex-col mb-4">
        <Input
          id="company-name"
          label={t("subscription.company-name") + " *"}
          value={companyName}
          placeholder={t("subscription.company-name-place-holder")}
          inputChange={(event: any) => {
            companyName = event.value;
          }}
          containerClasses="h-[56px] shadow-lg"
          labelClasses="text-base-content text-sm"
          classes="text-base"
        />
      </div>

      <div class="flex-1 flex flex-col mb-4">
        <Input
          id="street-number"
          label={t("subscription.street-number") + " *"}
          value={street}
          placeholder={t("subscription.street-number-placeholder")}
          inputChange={(event: any) => {
            street = event.value;
          }}
          containerClasses="h-[56px] shadow-lg"
          labelClasses="text-base-content text-sm"
          classes="text-base"
        />
      </div>
    </div>

    <div
      class="block md:flex lg:flex flex-row md:space-x-8 space-x-0 lg:space-x-8"
    >
      <div class="flex-1 flex flex-col mb-4">
        <Input
          id="zip-code"
          label={t("subscription.zip-code") + " *"}
          value={zipCode}
          placeholder={t("subscription.zip-code-place-holder")}
          inputChange={(event: any) => {
            zipCode = event.value;
          }}
          containerClasses="h-[56px] shadow-lg"
          labelClasses="text-base-content text-sm"
          classes="text-base"
        />
      </div>

      <div class="flex-1 flex flex-col mb-4">
        <Input
          id="location"
          label={t("subscription.location") + " *"}
          value={location}
          placeholder={t("subscription.location-place-holder")}
          inputChange={(event: any) => {
            location = event.value;
          }}
          containerClasses="h-[56px] shadow-lg"
          labelClasses="text-base-content text-sm"
          classes="text-base"
        />
      </div>
    </div>

    <div
      class="block md:flex lg:flex flex-row md:space-x-8 space-x-0 lg:space-x-8"
    >
      <div class="flex-1 flex flex-col mb-4">
        <Input
          id="country"
          label={t("subscription.country") + " *"}
          value={"Schweiz"}
          containerClasses="h-[56px] shadow-lg"
          labelClasses="text-base-content text-sm"
          classes="text-base"
          disabled={true}
        />
      </div>
      <div class="flex-1 flex flex-col mb-4">
        <Input
          id="email"
          label={t("subscription.billing-email") + " *"}
          value={billingEmail}
          placeholder={t("subscription.billing-email-plcae-holder")}
          inputChange={(event: any) => {
            billingEmail = event.value;
          }}
          containerClasses="h-[56px] shadow-md"
          labelClasses="text-base-content text-sm"
          classes="text-base"
        />
      </div>
    </div>

    <br class="mt-6" />
    <p class="font-sans text-base font-medium text-gray-600 mt-6 mb-4">
      {t("subscription.billing-method")}
    </p>

    <div
      class="block md:flex lg:flex flex-row md:space-x-8 space-x-0 lg:space-x-8"
    >
      <div class="flex-1 flex flex-col mb-4">
        <div
          class="bg-white shadow-md rounded-lg flex flex-col justify-between space-y-2 px-6 py-4 w-full"
        >
          <div class="flex items-center">
            <input
              type="radio"
              id="stripe-checkout"
              name="billing_method"
              class="radio"
              value={BillingMethod.CreditCard}
              checked={billingMethod == BillingMethod.CreditCard}
              onchange={() => {
                billingMethod = BillingMethod.CreditCard;
              }}
            />
            <label
              for="stripe-checkout"
              class="ml-2 text-sm font-medium text-[#0F172A]"
              >{t("subscription.billing-method-stripe")}</label
            >
          </div>
          <div class="flex items-center">
            <input
              type="radio"
              id="monthly-invoice"
              name="billing_method"
              class="radio"
              value={BillingMethod.MonthlyInvoice}
              checked={billingMethod == BillingMethod.MonthlyInvoice}
              onchange={() => {
                billingMethod = BillingMethod.MonthlyInvoice;
              }}
            />
            <label
              for="monthly-invoice"
              class="ml-2 text-sm font-medium text-[#0F172A]"
              >{t("subscription.monthly-invoice-email")}</label
            >
          </div>
        </div>
      </div>
      <div class="flex-1 flex flex-col mb-4"></div>
    </div>
  </div>

  <!-- Next -->
  <div class="w-full flex items-center justify-end rounded-lg p-4">
    <button
      class="btn btn-active btn-primary min-w-[144px]"
      onclick={() => {
        handleNext();
      }}
    >
      {t("subscription.create-my-aibox")}
    </button>
  </div>
</div>

<AlertDialog
  bind:modal={alertModal}
  bind:message={alertMessage}
  okText={t("common.ok")}
/>

<Loading show={loading} />
