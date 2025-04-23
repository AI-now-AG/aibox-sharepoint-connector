export enum SubscriptionPackageId {
  Starter = "Starter",
  Teams = "Teams",
  Pro = "Pro",
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

export const AddOnsLabels: Record<AudioOptionId, string> = {
  [AudioOptionId.AudioBasis]: "Audio Basis",
  [AudioOptionId.AudioBasisAddOnSubtitle]: "Add-on Untertitel",
  [AudioOptionId.AudioBasisAddOnLarge]: "Add-on Audio Xl",
  [AudioOptionId.AudioPremium]: "Audio Premium Package",
};
