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

export const AudioOptionLabels: Record<AudioOptionId, string> = {
  [AudioOptionId.AudioBasis]: "Audio Basis",
  [AudioOptionId.AudioBasisAddOnSubtitle]: "Add-on Untertitel",
  [AudioOptionId.AudioBasisAddOnLarge]: "Add-on Audio Xl",
  [AudioOptionId.AudioPremium]: "Audio Premium Package",
};

export const SUBSCIPTION_STEP = {
  Step0: 0,
  Step1: 1,
  Step2: 2,
  Step3: 3,
  Step4: 4,
  Completed: 5,
};
