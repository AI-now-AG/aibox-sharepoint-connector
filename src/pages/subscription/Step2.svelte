<script lang="ts">
  import Input from "$components/Input/Input.svelte";
  import { useTranslations } from "$i18n/utils";
  const t = useTranslations();

  const BiiliggMethod = {
    MonthlyEmailInvoice: "invoid",
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
  <h1 class="font-sanns text-3xl font-bold text-black mt-2">
    {t("subscription.provide-billing-information")}
  </h1>
  <p class="font-sans text-base font-medium text-gray-600 mt-6 mb-10">
    {t("subscription.provide-billing-information-description")}
  </p>

  <!-- Form -->
  <div class="w-full mx-auto">
    <div class="flex flex-row space-x-8">
      <div class="flex-1 flex flex-col mb-4">
        <Input
          id="company-name"
          label={t("subscription.company-name")}
          value={companyName}
          placeholder={t("subscription.company-name-place-holder")}
          inputChange={(event: any) => {
            companyName = event.value;
          }}
          containerClasses="h-[56px] shadow-xl"
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
          containerClasses="h-[56px] shadow-xl"
          labelClasses="text-base-content text-sm"
          classes="text-base"
        />
      </div>
    </div>

    <div class="flex flex-row space-x-8">
      <div class="flex-1 flex flex-col mb-4">
        <Input
          id="zip-code"
          label={t("subscription.zip-code")}
          value={zipCode}
          placeholder={t("subscription.zip-code-place-holder")}
          inputChange={(event: any) => {
            zipCode = event.value;
          }}
          containerClasses="h-[56px] shadow-xl"
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
          containerClasses="h-[56px] shadow-xl"
          labelClasses="text-base-content text-sm"
          classes="text-base"
        />
      </div>
    </div>

    <br class="mt-6" />
    <p class="font-sans text-base font-medium text-gray-600 mt-6 mb-10">
      {t("subscription.billing-method")}
    </p>

    <div class="flex flex-row space-x-8">
      <div class="flex-1 flex flex-col mb-4">
        <Input
          id="monthly-invoice-email"
          label={t("subscription.monthly-invoice-email")}
          value={billingMethod}
          placeholder={t("subscription.monthly-invoice-email")}
          containerClasses="h-[56px] shadow-xl"
          labelClasses="text-base-content text-sm"
          classes="text-base"
        />
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
          containerClasses="h-[56px] shadow-xl"
          labelClasses="text-base-content text-sm"
          classes="text-base"
        />
      </div>
    </div>

    <div class="flex flex-row space-x-8">
      <div class="flex-1 flex flex-col mb-4">
        <Input
          id="name"
          label={t("subscription.credit-card")}
          value={"Creadit Card"}
          placeholder={t("subscription.credit-card")}
          containerClasses="h-[56px] shadow-xl"
          labelClasses="text-base-content text-sm"
          classes="text-base"
        />
      </div>

      <div class="flex-1 flex flex-col mb-4"></div>
    </div>
    <div class="flex flex-row space-x-8">
      <div class="flex-1 flex flex-col mb-4">
        <div class="rounded-lg bg-[#00B3F059] px-6 py-[12px]">
          {t("subscription.other-payment-method")}
        </div>
      </div>

      <div class="flex-1 flex flex-col mb-4"></div>
    </div>
  </div>

  <!-- Next -->
  <div class="fixed bottom-4 right-10 w-[33.3%] flex items-center justify-end">
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
