<script lang="ts">
  import Input from "$components/Input/Input.svelte";
  import SubsciptionSteps from "$components/subscription/SubsciptionSteps.svelte";
  import { useTranslations } from "$i18n/utils";
  const t = useTranslations();

  const BiiliggMethod = {
    MonthlyEmailInvoice: "invoice",
    MonthlyCreditCard: "creditcard",
  };

  let companyName = $state("");
  let street = $state("");
  let zipCode = $state("");
  let location = $state("");
  let billingEmail = $state("");
  let billingMethod = $state(BiiliggMethod.MonthlyEmailInvoice);

  function handleNext() {
    // TODO: Handle validate before go to next step
    window.location.href = "/subscription/step3";
  }
</script>

<div class="max-w-5xl mx-auto">
  <div
    class="bg-[#491EFF] p-4 rounded-lg mb-6 flex md:hidden lg:hidden items-center justify-center"
  >
    <SubsciptionSteps currentStep={2} />
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
          label={t("subscription.company-name")}
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
          label={t("subscription.street-number")}
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
          label={t("subscription.zip-code")}
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
          label={t("subscription.location")}
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

    <br class="mt-6" />
    <p class="font-sans text-base font-medium text-gray-600 mt-6 mb-4">
      {t("subscription.billing-method")}
    </p>

    <div
      class="block md:flex lg:flex flex-row md:space-x-8 space-x-0 lg:space-x-8"
    >
      <div class="flex-1 flex flex-col mb-4">
        <button
          class="bg-white shadow-md rounded-lg flex justify-between items-center px-6 py-4 w-full mt-9"
          onclick={() => {}}
        >
          <input
            type="checkbox"
            checked={billingMethod === BiiliggMethod.MonthlyEmailInvoice}
            class="checkbox checkbox-primary w-6]"
            value={BiiliggMethod.MonthlyEmailInvoice}
            disabled
          />
          <h2 class="text-sm font-medium text-[#0F172A] text-left flex-1 px-4">
            {t("subscription.monthly-invoice-email")}
          </h2>
        </button>
      </div>

      <div class="flex-1 flex flex-col mb-4">
        <Input
          id="email"
          label={t("subscription.billing-email")}
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

    <div
      class="block md:flex lg:flex flex-row md:space-x-8 space-x-0 lg:space-x-8"
    >
      <div class="flex-1 flex flex-col mb-4">
        <button
          class="bg-gray-200 rounded-lg flex justify-between items-center px-6 py-4 w-full"
          onclick={() => {}}
        >
          <input
            type="checkbox"
            checked={billingMethod === BiiliggMethod.MonthlyCreditCard}
            class="checkbox checkbox-primary w-6]"
            value={BiiliggMethod.MonthlyCreditCard}
            disabled
          />
          <h2 class="text-sm font-medium text-[#0F172A] text-left flex-1 px-4">
            {t("subscription.credit-card")}
          </h2>
        </button>
      </div>

      <div class="flex-1 flex flex-col mb-4"></div>
    </div>
    <div
      class="block md:flex lg:flex flex-row md:space-x-8 space-x-0 lg:space-x-8"
    >
      <div class="flex-1 flex flex-col mb-4">
        <div class="rounded-lg bg-[#00B3F059] px-6 py-[12px]">
          {t("subscription.other-payment-method")}
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
      {t("common.next")}
    </button>
  </div>
</div>
