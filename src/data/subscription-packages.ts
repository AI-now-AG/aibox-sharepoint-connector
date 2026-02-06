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
      price: 29,
      currency: "CHF",
      priceText: "29 CHF / pro Monat",
      features: {
        en: [
          "1 User included",
          "Additional user CHF 20.-",
          "All AI models included",
          "AI image generation",
          "Support via email",
        ],
        de: [
          "1 Benutzer inklusive",
          "Zusätzlicher Benutzer CHF 20.-",
          "Alle KI Modelle inkl.",
          "KI Bilderstellung",
          "Standardsupport E-Mail",
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
      price: 179,
      currency: "CHF",
      priceText: "179 CHF / pro Monat",
      features: {
        en: [
          "15 Users included",
          "Additional User CHF 15.-",
          "User Management included",
          "Online kickoff with team",
        ],
        de: [
          "15 Benutzer inklusive",
          "Zusätzlicher Benutzer CHF 15.-",
          "Benutzerverwaltung inklusive",
          "Online Kickoff mit Team",
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
      price: 339,
      currency: "CHF",
      priceText: "339 CHF / pro Monat",
      features: {
        en: [
          "30 Users included",
          "Additional User CHF 10.-",
          "Personal Support",
          "Dedicated AI Models possible",
        ],
        de: [
          "30 Benutzer inklusive",
          "Zusätzlicher Benutzer CHF 10.-",
          "Persönlicher Support",
          "Dediziertes KI möglich",
        ],
      },
    },
  },
  audioOptions: {
    // Select [Subtitle Studio Plus] or [Subtitle Studio Basic] | [Audio to Text Large] or [Audio to Text Basic]
    AudioPremium: {
      // Change from [Audio zu Text Premium] to [Subtitle Studio Plus]
      id: AudioOptionId.AudioPremium,
      name: {
        en: "Subtitle Studio Plus",
        de: "Untertitel Studio Plus",
      },
      price: 300,
      currency: "CHF",
      pricePrefix: "",
      priceText: "300 CHF / pro Monat",
    },
    AudioBasisAddOnSubtitle: {
      // Change from [Add-On Subtitle] to [Subtitle Studio Basic] ==> REMOVED
      id: AudioOptionId.AudioBasisAddOnSubtitle,
      name: {
        en: "Subtitle Studio Basic",
        de: "Untertitel Studio Basis",
      },
      price: 50,
      currency: "CHF",
      pricePrefix: "",
      priceText: "50 CHF / pro Monat",
    },
    AudioBasisAddOnLarge: {
      // Change from [Add-On Audio XL] to [Audio to Text Large]
      id: AudioOptionId.AudioBasisAddOnLarge,
      name: {
        en: "Audio to Text Large",
        de: "Audio zu Text Large",
      },
      price: 49,
      currency: "CHF",
      pricePrefix: "",
      priceText: "49 CHF / pro Monat",
    },
    AudioBasis: {
      id: AudioOptionId.AudioBasis,
      name: {
        en: "Audio to Text Basis",
        de: "Audio zu Text Basis",
      },
      price: 29,
      currency: "CHF",
      pricePrefix: "",
      priceText: "29 CHF / pro Monat",
    },
    // NEW ""Audio to Text" option
    AudioToText: {
      id: AudioOptionId.AudioToText,
      name: {
        en: "Audio to Text",
        de: "Audio zu Text",
      },
      price: 29,
      currency: "CHF",
      pricePrefix: "Ab ",
      priceText: "29 CHF / pro Monat",
    },
  },
};
