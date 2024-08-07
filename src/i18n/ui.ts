export const languages = {
  en: "English",
  de: "Deutsch",
};

export const defaultLang = "en";

const en = {
  "site.title": "Welcome to aibox",
  "site.description":
    "AI-powered solution for streamlining tasks and boosting productivity. Customizable for small to mid-sized companies. Enhance efficiency and drive innovation in your workflow.",

  "header.introduction": "Introduction",
  "header.login": "Sign In",
  "header.about": "About",
  "header.theme": "Theme",

  "footer.how-it-works": "How it works",
  "footer.privacy-policy": "Privacy Policy",
  "footer.terms-of-service": "Terms of Service",

  "nav.all-widgets": "All AI Widgets",
  "nav.text-writing": "Text Writing",
  "nav.settings": "Settings",
  "nav.settings.prompts": "Prompts",
  "nav.settings.instructions": "Instructions",
  "nav.settings.knowledge-base": "Knowledge Base",
  "nav.settings.categories": "Categories",

  "login.welcome": "Welcome to",
  "login.title": "Sign in to your account",
  "login.email": "Email",
  "login.password": "Password",
  "login.submit": "Sign in",

  "welcome.title": "AI for easy and efficient business operations",
  "welcome.text":
    "aibox is designed to streamline internal tasks and enhance productivity in workflows. Perfect for small to mid-sized companies, our solution is customizable to meet your needs, driving efficiency and fostering innovation.",
  "welcome.get-started": "Get started",
  "welcome.explore": "Explore more widgets",

  "prompt-library.prompts.title": "Prompt Management",
  "prompt-library.prompts.add": "Add Prompt",
  "prompt-library.prompts.search": "Type here",
  "prompt-library.prompts.filter": "Filter",
  "prompt-library.prompts.all": "All Prompts",
  "prompt-library.prompts.view": "View prompt",

  "prompt-library.add.prompts.title": "Title",
  "prompt-library.add.prompts.category": "Category",
  "prompt-library.add.prompts.group": "Group",
  "prompt-library.add.prompts.prompt": "Prompt",
  "prompt-library.add.prompts.instructions": "Instructions",
  "prompt-library.add.prompts.knowledge-base": "Knowledge Base",
  "prompt-library.add.prompts.save": "Save Prompt",

  "prompt-library.instructions.title": "Instruction Management",
  "prompt-library.instructions.add": "Add instruction",
  "prompt-library.instructions.all": "All Instructions",
  "prompt-library.instructions.view": "View",

  "prompt-library.add.instructions.title": "Instruction title",
  "prompt-library.add.instructions.text": "Instruction text",
  "prompt-library.add.instructions.save": "Save instruction",

  "prompt-library.knowledgebase.title": "Knowledge Base Management",
  "prompt-library.knowledgebase.add": "Add knowledge base",
  "prompt-library.knowledgebase.all": "All knowledge base",
  "prompt-library.knowledgebase.view": "View",

  "prompt-library.add.knowledgebase.title": "Knowledge base title",
  "prompt-library.add.knowledgebase.text": "Knowledge base text",
  "prompt-library.add.knowledgebase.save": "Save knowledge base",

  "prompt-library.categories.title": "Categories",
  "prompt-library.categories.add": "Add Category",

  "prompt-execution.card.showMore": "more prompts",
  "prompt-execution.card.showLess": "less prompts",
};

const de = {
  "site.title": "Willkommen bei der aibox",
  "site.description":
    "KI-gestützte Lösung zur Optimierung von Aufgaben und Steigerung der Produktivität. Anpassbar für kleine bis mittlere Unternehmen. Verbessern Sie Effizienz und fördern Sie Innovation in Ihrem Arbeitsablauf.",

  "header.introduction": "Hilfe",
  "header.about": "Über",
  "header.theme": "Farben",
  "header.login": "Anmelden",

  "footer.how-it-works": "Wie es funktioniert",
  "footer.privacy-policy": "Datenschutz",
  "footer.terms-of-service": "Nutzungsbedingungen",

  "nav.all-widgets": "Alle KI-Widgets",
  "nav.text-writing": "Redaktion",
  "nav.settings": "Einstellungen",
  "nav.settings.prompts": "Aufforderungen",
  "nav.settings.instructions": "Anweisungen",
  "nav.settings.knowledge-base": "Wissensbasis",
  "nav.settings.categories": "Kategorien",

  "login.welcome": "Willkommen bei der",
  "login.title": "In Ihr Konto einloggen",
  "login.email": "E-Mail",
  "login.password": "Passwort",
  "login.submit": "Anmelden",

  "welcome.title": "KI für einfache und effiziente Geschäftsabläufe",
  "welcome.text":
    "aibox wurde entwickelt, um interne Aufgaben zu optimieren und die Produktivität in Arbeitsabläufen zu steigern. Unsere Lösung ist perfekt für kleine bis mittelgroße Unternehmen und lässt sich an Ihre Bedürfnisse anpassen, um Effizienz voranzutreiben und Innovation zu fördern.",
  "welcome.get-started": "Los geht's",
  "welcome.explore": "Mehr Widgets entdecken",

  "prompt-library.prompts.title": "Prompte Verwaltung",
  "prompt-library.prompts.add": "Neuer Prompt",
  "prompt-library.prompts.search": "Geben Sie hier ein",
  "prompt-library.prompts.filter": "Filter",
  "prompt-library.prompts.all": "Alle Eingabeaufforderungen",
  "prompt-library.prompts.view": "Eingabeaufforderung anzeigen",

  "prompt-library.add.prompts.title": "Titel",
  "prompt-library.add.prompts.category": "Kategorie",
  "prompt-library.add.prompts.group": "Gruppe",
  "prompt-library.add.prompts.prompt": "Prompt",
  "prompt-library.add.prompts.instructions": "Anweisungen",
  "prompt-library.add.prompts.knowledge-base": "Wissensbasis",
  "prompt-library.add.prompts.save": "Eingabeaufforderung speichern",

  "prompt-library.instructions.title": "Unterrichtsverwaltung",
  "prompt-library.instructions.add": "Anweisung hinzufügen",
  "prompt-library.instructions.all": "Alle Anweisungen",
  "prompt-library.instructions.view": "View",

  "prompt-library.add.instructions.title": "Titel der Anweisung",
  "prompt-library.add.instructions.text": "Anweisungstext",
  "prompt-library.add.instructions.save": "Anleitung speichern",

  "prompt-library.categories.title": "Kategorien",
  "prompt-library.categories.add": "Neue Kategorie",

  "prompt-execution.card.showMore": "weitere Anregungen",
  "prompt-execution.card.showLess": "weniger Aufforderungen",
};

export const ui = {
  en,
  de: { ...en, ...de },
} as const;
