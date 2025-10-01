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
      price: 29, // Change from [25] to [29]
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
  audioOptions: { // Select [Subtitle Studio Plus] or [Subtitle Studio Basic] | [Audio to Text Large] or [Audio to Text Basic]
    AudioPremium: { // Change from [Audio zu Text Premium] to [Subtitle Studio Plus]
      id: AudioOptionId.AudioPremium,
      name: {
        en: "Subtitle Studio Plus",
        de: "Subtitle Studio Plus",
      },
      price: 150, // Change from [65] to [150]
      currency: "CHF",
      priceText: "65 CHF / pro Monat",
    },
    AudioBasisAddOnSubtitle: { // Change from [Add-On Subtitle] to [Subtitle Studio Basic]
      id: AudioOptionId.AudioBasisAddOnSubtitle,
      name: {
        en: "Subtitle Studio Basic",
        de: "Subtitle Studio Basic",
      },
      price: 50,// Change from [25] to [50]
      currency: "CHF",
      priceText: "25 CHF / per Monat",
    },
    AudioBasisAddOnLarge: {  // Change from [Add-On Audio XL] to [Audio to Text Large]
      id: AudioOptionId.AudioBasisAddOnLarge,
      name: {
        en: "Audio to Text Large",
        de: "Audio to Text Large",
      },
      price: 49, // Change from [15] to [49]
      currency: "CHF",
      priceText: "25 CHF / per Monat",
    },
    AudioBasis: {
      id: AudioOptionId.AudioBasis,
      name: {
        en: "Audio zu Text Basis",
        de: "Audio zu Text Basis",
      },
      price: 29, // Change from [25] to [29]
      currency: "CHF",
      priceText: "25 CHF / pro Monat",
    },
  },
};
