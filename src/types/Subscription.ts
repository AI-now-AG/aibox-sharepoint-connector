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

export enum AudioOptionId {
  AudioPremium = "AudioPremium",
  AudioBasis = "AudioBasis",
  AudioBasisAddOnSubtitle = "AudioBasisAddOnSubtitle",
  AudioBasisAddOnLarge = "AudioBasisAddOnLarge",
}

export type ProductKeys =
  | keyof typeof SubscriptionPackageId
  | keyof typeof AudioOptionId;

export const AudioOptionLabels: Record<AudioOptionId, string> = {
  [AudioOptionId.AudioBasis]: "Audio Basis",
  [AudioOptionId.AudioBasisAddOnSubtitle]: "Add-on Untertitel",
  [AudioOptionId.AudioBasisAddOnLarge]: "Add-on Audio Xl",
  [AudioOptionId.AudioPremium]: "Audio Premium Package",
};

export enum BillingMethod {
  CreditCard = "credit_card",
  MonthlyInvoice = "monthly_invoice",
}

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
