export enum PlanName {
  Starter = "Starter",
  Teams = "Teams",
  Pro = "Pro",
}

export enum SubscriptionStatus {
  Active = "active",
  Canceled = "canceled",
  Trialing = "trialing",
}

export enum AddOnsName {
  AudioBasis = "audio-basis",
  AudioSubtitles = "audio-subtitles",
  AudioXL = "audio-xl",
  AudioPremium = "audio-premium",
}

export const AddOnsLabels: Record<AddOnsName, string> = {
  [AddOnsName.AudioBasis]: "Audio Basis",
  [AddOnsName.AudioSubtitles]: "Add-on Untertitel",
  [AddOnsName.AudioXL]: "Add-on Audio Xl",
  [AddOnsName.AudioPremium]: "Audio Premium Package",
};
