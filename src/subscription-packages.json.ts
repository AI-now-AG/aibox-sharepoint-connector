export const SubscriptionPackageId = {
  Starter: "Starter",
  Teams: "Teams",
  Pro: "Pro",
};

export const AudioOptionId = {
  AudioPremium: "AudioPremium",
  AudioBasis: "AudioBasis",
  AudioBasisAddOnSubtitle: "AudioBasisAddOnSubtitle",
  AudioBasisAddOnLarge: "AudioBasisAddOnLarge",
};

export const SubscriptionPackages = {
  plan: {
    Starter: {
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
    Teams: {
      id: SubscriptionPackageId.Teams,
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
    Pro: {
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
    AudioPremium: {
      id: AudioOptionId.AudioPremium,
      name: {
        en: "AUDIO PREMIUM PACKAGE",
        de: "AUDIO PREMIUM PACKAGE",
      },
      price: 65,
      currency: "CHF",
      priceText: "65 CHF / per month",
    },
    AudioBasis: {
      id: AudioOptionId.AudioBasis,
      name: {
        en: "AUDIO BASIS",
        de: "AUDIO BASIS",
      },
      price: 25,
      currency: "CHF",
      priceText: "25 CHF / per month",
    },
    AudioBasisAddOnSubtitle: {
      id: AudioOptionId.AudioBasisAddOnSubtitle,
      name: {
        en: "ADD-ON UNTERTITEL",
        de: "ADD-ON UNTERTITEL",
      },
      price: 25,
      currency: "CHF",
      priceText: "25 CHF / per month",
    },
    AudioBasisAddOnLarge: {
      id: AudioOptionId.AudioBasisAddOnLarge,
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
