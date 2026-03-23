<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { BillingMethod } from "$types/Subscription";

  interface Props {
    billingMethod: string;
    availableMethods?: BillingMethod[];
  }
  let {
    billingMethod = $bindable(""),
    availableMethods = Object.values(BillingMethod),
  }: Props = $props();

  const t = useTranslations();

  const billingOptions = [
    {
      id: "stripe-checkout",
      value: BillingMethod.CreditCard,
      label: t("subscription.billing-method-stripe"),
    },
    {
      id: "monthly-invoice",
      value: BillingMethod.MonthlyInvoice,
      label: t("subscription.monthly-invoice-email"),
    },
    {
      id: "yearly-invoice",
      value: BillingMethod.YearlyInvoice,
      label: t("subscription.yearly-invoice-email"),
    },
  ];
  const visibleOptions = billingOptions.filter((option) =>
    availableMethods.includes(option.value),
  );
</script>

<div class="flex flex-row md:space-x-8 space-x-0 lg:space-x-8">
  <div
    class="flex flex-row bg-white shadow-md rounded-lg flex flex-col justify-between space-y-2 px-6 py-4 w-full"
  >
    {#each visibleOptions as option}
      <div class="flex flex-1 items-center">
        <input
          type="radio"
          id={option.id}
          name="billing_method"
          class="radio"
          value={option.value}
          checked={billingMethod === option.value}
          onchange={() => (billingMethod = option.value)}
        />

        <label for={option.id} class="ml-2 text-sm font-medium text-[#0F172A]">
          {option.label}
        </label>
      </div>
    {/each}
  </div>
</div>
