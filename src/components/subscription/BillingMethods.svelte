<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { BillingMethod } from "$types/Subscription";

  interface Props {
    billingMethod: string;
    defaultLanguage?: string;
  }
  let { billingMethod = $bindable(""), defaultLanguage = "en" }: Props =
    $props();

  const t = useTranslations(defaultLanguage);
</script>

<div class="flex flex-row md:space-x-8 space-x-0 lg:space-x-8">
  <div
    class="flex flex-row bg-white shadow-md rounded-lg flex flex-col justify-between space-y-2 px-6 py-4 w-full"
  >
    <div class="flex flex-1 items-center">
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
    <div class="flex flex-1 items-center">
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
