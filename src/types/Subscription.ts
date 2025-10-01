import { useTranslations } from "$i18n/utils";
const t = useTranslations();

export enum SubscriptionPackageId {
  Starter = "Starter",
  Teams = "Teams",
  Pro = "Pro",
}

export enum SubscriptionExtraPackage {
  Internal = "Internal",
  Enterprise = "Enterprise",
}

export enum SubscriptionStatus {
  Active = "active",
  Canceled = "canceled",
  Trialing = "trialing",
}

// Applied changes from this ticket: https://ainow.atlassian.net/browse/AINOW-1430
export enum AudioOptionId {
  /** [Audio to Text Basic] */
  AudioBasis = "AudioBasis",

  /** [Audio to Text Large] */
  AudioBasisAddOnLarge = "AudioBasisAddOnLarge",

  /** [Subtitle Studio Basic] */
  AudioBasisAddOnSubtitle = "AudioBasisAddOnSubtitle",

  /** [Subtitle Studio Plus] => Included Subtitle editor */
  AudioPremium = "AudioPremium",
}

export type ProductKeys =
  | keyof typeof SubscriptionPackageId
  | keyof typeof AudioOptionId;

// Applied changes from this ticket: https://ainow.atlassian.net/browse/AINOW-1430
export const AudioOptionLabels: Record<AudioOptionId, string> = {
  [AudioOptionId.AudioBasis]: "Audio to Text Basic", // [Audio to Text Basic]
  [AudioOptionId.AudioBasisAddOnLarge]: "Audio to Text Large", // [Audio to Text Large]
  [AudioOptionId.AudioBasisAddOnSubtitle]: "Subtitle Studio Basic", // [Subtitle Studio Basic]
  [AudioOptionId.AudioPremium]: "Subtitle Studio Plus", // [Subtitle Studio Plus]
};

export enum BillingMethod {
  CreditCard = "credit_card",
  MonthlyInvoice = "monthly_invoice",
}

export const BillingMethodLabels: Record<BillingMethod, string> = {
  [BillingMethod.CreditCard]: t("subscription.billing-method-stripe"),
  [BillingMethod.MonthlyInvoice]: t("subscription.monthly-invoice-email"),
};

export const SubscriptionStep = {
  Step0: 0,
  Step1: 1,
  Step2: 2,
  Step3: 3,
  Step4: 4,
  Completed: 5,
};

export enum RoutePath {
  Step1 = "step1",
  Step2 = "step2",
  Step3 = "step3",
  Step4 = "step4",
}
