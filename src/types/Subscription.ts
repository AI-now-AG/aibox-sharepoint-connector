import { useTranslations } from "$i18n/utils";
const t = useTranslations();

export enum SubscriptionPackageId {
  Starter = "Starter",
  Teams = "Teams",
  Pro = "Pro",
}

export enum SubscriptionExtraPackage {
  Enterprise = "Enterprise",
}

export const SubscriptionPackageLabels: Record<
  SubscriptionPackageId | SubscriptionExtraPackage,
  string
> = {
  [SubscriptionPackageId.Starter]: "aibox Starter",
  [SubscriptionPackageId.Teams]: "aibox Teams",
  [SubscriptionPackageId.Pro]: "aibox Pro",
  [SubscriptionExtraPackage.Enterprise]: "aibox Enterprise",
};

export enum SubscriptionIncludedUsers {
  Starter = 1,
  Teams = 10,
  Pro = 25,
  Enterprise = 0,
}

export enum SubscriptionIncludedKbMB {
  Starter = 10,
  Teams = 100,
  Pro = 200,
  Enterprise = 0,
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

  /** NEW "Audio To Text" option */
  AudioToText = "AudioToText",
}

export type AudioPlanCompositeKey =
  `${Extract<keyof typeof AudioOptionId, "AudioToText">}_${keyof typeof SubscriptionPackageId}`;

export type ProductKeys =
  | keyof typeof SubscriptionPackageId
  | keyof typeof AudioOptionId
  | AudioPlanCompositeKey;

// Applied changes from this ticket: https://ainow.atlassian.net/browse/AINOW-1430
export const AudioOptionLabels: Record<AudioOptionId, string> = {
  [AudioOptionId.AudioBasis]: "Audio to Text Basic", // [Audio to Text Basic]
  [AudioOptionId.AudioBasisAddOnLarge]: "Audio to Text Large", // [Audio to Text Large]
  [AudioOptionId.AudioBasisAddOnSubtitle]: "Subtitle Studio Basic", // [Subtitle Studio Basic]
  [AudioOptionId.AudioPremium]: "Subtitle Studio Plus", // [Subtitle Studio Plus]
  [AudioOptionId.AudioToText]: "Audio to Text", // [Audio to Text]
};

export enum BillingMethod {
  CreditCard = "credit_card",
  MonthlyInvoice = "monthly_invoice",
  YearlyInvoice = "yearly_invoice",
}

export const BillingMethodLabels: Record<BillingMethod, string> = {
  [BillingMethod.CreditCard]: t("subscription.billing-method-stripe"),
  [BillingMethod.MonthlyInvoice]: t("subscription.monthly-invoice-email"),
  [BillingMethod.YearlyInvoice]: t("subscription.yearly-invoice-email"),
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

export interface TagItem {
  title: string;
  value: string;
  description: string;
  icon?: string | null | undefined;
  iconColor?: string | null | undefined;
}
export interface CategoryItem {
  title: string;
  value: string;
  tags: string[];
}

export enum CountryCode {
  CH = "CH", // Switzerland
  DE = "DE", // Germany
  AT = "AT", // Austria
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CountryMap: Record<CountryCode, any> = {
  [CountryCode.CH]: { title: "Schweiz", value: CountryCode.CH },
  [CountryCode.DE]: { title: "Deutschland", value: CountryCode.DE },
  [CountryCode.AT]: { title: "Österreich", value: CountryCode.AT },
};

export const Countries = [
  CountryMap[CountryCode.CH],
  CountryMap[CountryCode.DE],
  CountryMap[CountryCode.AT],
];
