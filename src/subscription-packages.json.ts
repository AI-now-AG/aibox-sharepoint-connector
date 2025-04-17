export const SubscriptionPackageId = {
  Starter: "subscription_package_starter",
  Team: "subscription_package_team",
  Pro: "subscription_package_pro",
};

export const AudioOptionId = {
  AudioPermium: "audio_premium",
  AudioBasic: "audio_basis",
  AudioBasicAddOnSubtitle: "audio_basis_addon_subtitle",
  AudioBasicAddOnLarge: "audio_basis_addon_large",
};

export const SubscriptionPackages = {
  plan: {
    starter: {
      id: SubscriptionPackageId.Starter,
      name: {
        en: "aibox Starter",
        de: "aibox Starter",
      },
      description: {
        en: "For Solo Users & Beginners",
        de: "For Solo Users & Beginners",
      },
      price: 25,
      currency: "CHF",
      priceText: "25 CHF / per month",
      features: {
        en: [
          "1 User included",
          "Additional user CHF 20.-",
          "Manage your own use cases",
          "No storage of user data",
          "<b>100 Credits included</b>",
        ],
        de: [
          "1 User included",
          "Additional user CHF 20.-",
          "Manage your own use cases",
          "No storage of user data",
          "<b>100 Credits included</b>",
        ],
      },
    },
    team: {
      id: SubscriptionPackageId.Team,
      name: {
        en: "aibox Teams",
        de: "aibox Teams",
      },
      description: {
        en: "For Growing Teams",
        de: "For Growing Teams",
      },
      price: 149,
      currency: "CHF",
      priceText: "149 CHF / per month",
      features: {
        en: [
          "15 Users included",
          "Additional User CHF 15.-",
          "User Management included",
          "Option Private LLM (CH/EU)",
          "<b>400 Credits included</b>",
        ],
        de: [
          "15 Users included",
          "Additional User CHF 15.-",
          "User Management included",
          "Option Private LLM (CH/EU)",
          "<b>400 Credits included</b>",
        ],
      },
    },
    pro: {
      id: SubscriptionPackageId.Pro,
      name: {
        en: "aibox Pro",
        de: "aibox Pro",
      },
      description: {
        en: "For Power Teams & Heavy Usage",
        de: "For Power Teams & Heavy Usage",
      },
      price: 249,
      currency: "CHF",
      priceText: "249 CHF / per month",
      features: {
        en: [
          "30 Users included",
          "Additional User CHF 10.-",
          "Premium Support",
          "Optional Enterprise Login",
          "<b>800 Credits included</b>",
        ],
        de: [
          "30 Users included",
          "Additional User CHF 10.-",
          "Premium Support",
          "Optional Enterprise Login",
          "<b>800 Credits included</b>",
        ],
      },
    },
  },
  audioOptions: {
    audioPremium: {
      id: AudioOptionId.AudioPermium,
      name: {
        en: "AUDIO PREMIUM PACKAGE",
        de: "AUDIO PREMIUM PACKAGE",
      },
      price: 65,
      currency: "CHF",
      priceText: "65 CHF / per month",
    },
    audioBasis: {
      id: AudioOptionId.AudioBasic,
      name: {
        en: "AUDIO BASIS",
        de: "AUDIO BASIS",
      },
      price: 25,
      currency: "CHF",
      priceText: "25 CHF / per month",
    },
    audioAddOnSubtitle: {
      id: AudioOptionId.AudioBasicAddOnSubtitle,
      name: {
        en: "ADD-ON UNTERTITEL",
        de: "ADD-ON UNTERTITEL",
      },
      price: 25,
      currency: "CHF",
      priceText: "25 CHF / per month",
    },
    audioAddOnLarge: {
      id: AudioOptionId.AudioBasicAddOnLarge,
      name: {
        en: "ADD-ON AUDIO XL",
        de: "ADD-ON AUDIO XL",
      },
      price: 15,
      currency: "CHF",
      priceText: "15 CHF / per month",
    },
  },
};
