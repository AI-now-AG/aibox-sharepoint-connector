import { AudioOptionId, SubscriptionPackageId } from "$types/Subscription";

export const SubscriptionPackages = {
  plan: {
    Starter: {
      id: SubscriptionPackageId.Starter,
      name: {
        en: "aibox Starter",
        de: "aibox Starter",
      },
      description: {
        en: "For single users & beginners",
        de: "Einzelanwender & Einsteiger",
      },
      price: 25,
      currency: "CHF",
      priceText: "25 CHF / pro Monat",
      features: {
        en: [
          "1 User included",
          "Additional user CHF 20.-",
          "Manage your own use cases",
          "No storage of user data",
          "<b>100 Credits included</b>",
        ],
        de: [
          "1 Benutzer inklusive",
          "Zusätzlicher Benutzer CHF 20.-",
          "Eigene Anwendungen verwalten",
          "Keine Speicherung von Nutzerdaten",
          "<b>100 Credits inklusive</b>",
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
        en: "For small & growing teams",
        de: "Für kleine & wachsende Teams",
      },
      price: 149,
      currency: "CHF",
      priceText: "149 CHF / pro Monat",
      features: {
        en: [
          "15 Users included",
          "Additional User CHF 15.-",
          "User Management included",
          "Option Private LLM (CH/EU)",
          "<b>400 Credits included</b>",
        ],
        de: [
          "15 Benutzer inklusive",
          "Zusätzlicher Benutzer CHF 15.-",
          "Benutzerverwaltung inklusive",
          "Optional privates LLM (CH/EU)",
          "<b>400 Credits inklusive</b>",
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
        en: "Power Teams & Heavy Usage",
        de: "Grosse Teams & intensive Nutzung",
      },
      price: 249,
      currency: "CHF",
      priceText: "249 CHF / pro Monat",
      features: {
        en: [
          "30 Users included",
          "Additional User CHF 10.-",
          "Premium Support",
          "Optional Enterprise Login",
          "<b>800 Credits included</b>",
        ],
        de: [
          "30 Benutzer inklusive",
          "Zusätzlicher Benutzer CHF 10.-",
          "Premium-Support",
          "Optionale Enterprise Login",
          "<b>800 Credits inklusive</b>",
        ],
      },
    },
  },
  audioOptions: {
    AudioPremium: {
      id: AudioOptionId.AudioPremium,
      name: {
        en: "Audio zu Text Premium",
        de: "Audio zu Text Premium",
      },
      price: 65,
      currency: "CHF",
      priceText: "65 CHF / pro Monat",
    },
    AudioBasis: {
      id: AudioOptionId.AudioBasis,
      name: {
        en: "Audio zu Text Basis",
        de: "Audio zu Text Basis",
      },
      price: 25,
      currency: "CHF",
      priceText: "25 CHF / pro Monat",
    },
    AudioBasisAddOnSubtitle: {
      id: AudioOptionId.AudioBasisAddOnSubtitle,
      name: {
        en: "Add-On Subtitle",
        de: "Add-On Untertitel",
      },
      price: 25,
      currency: "CHF",
      priceText: "25 CHF / per Monat",
    },
    AudioBasisAddOnLarge: {
      id: AudioOptionId.AudioBasisAddOnLarge,
      name: {
        en: "Add-On Audio XL",
        de: "Add-On Audio XL",
      },
      price: 15,
      currency: "CHF",
      priceText: "25 CHF / per Monat",
    },
  },
};
