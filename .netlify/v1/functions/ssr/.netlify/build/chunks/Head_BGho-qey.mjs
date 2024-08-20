import { c as createComponent, r as renderTemplate, g as renderHead, a as addAttribute, b as createAstro } from './astro/server_BvvS3v0v.mjs';

const defaultLang = "en";
const en = {
  "site.title": "Welcome to aibox",
  "site.description": "AI-powered solution for streamlining tasks and boosting productivity. Customizable for small to mid-sized companies. Enhance efficiency and drive innovation in your workflow.",
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
  "welcome.text": "aibox is designed to streamline internal tasks and enhance productivity in workflows. Perfect for small to mid-sized companies, our solution is customizable to meet your needs, driving efficiency and fostering innovation.",
  "welcome.get-started": "Get started",
  "welcome.explore": "Explore more widgets",
  "prompt-library.prompts.title": "Prompt Management",
  "prompt-library.prompts.add": "Add Prompt",
  "prompt-library.prompts.edit": "Edit Prompt",
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
  "prompt-library.add.prompts.saving": "Saving...",
  "prompt-library.instructions.title": "Instruction Management",
  "prompt-library.instructions.add": "Add instruction",
  "prompt-library.instructions.edit": "Edit instruction",
  "prompt-library.instructions.all": "All Instructions",
  "prompt-library.instructions.view": "View",
  "prompt-library.add.instructions.title": "Instruction title",
  "prompt-library.add.instructions.text": "Instruction text",
  "prompt-library.add.instructions.save": "Save instruction",
  "prompt-library.knowledgebase.title": "Knowledge Base Management",
  "prompt-library.knowledgebase.add": "Add knowledge base",
  "prompt-library.knowledgebase.edit": "Edit knowledge base",
  "prompt-library.knowledgebase.all": "All knowledge base",
  "prompt-library.knowledgebase.view": "View",
  "prompt-library.add.knowledgebase.title": "Knowledge base title",
  "prompt-library.add.knowledgebase.text": "Knowledge base text",
  "prompt-library.add.knowledgebase.save": "Save knowledge base",
  "prompt-library.categories.title": "Categories",
  "prompt-library.categories.add": "Add Category",
  "prompt-library.categories.edit": "Edit Category",
  "prompt-execution.card.showMore": "more prompts",
  "prompt-execution.card.showLess": "less prompts"
};
const de = {
  "site.title": "Willkommen bei der aibox",
  "site.description": "KI-gestützte Lösung zur Optimierung von Aufgaben und Steigerung der Produktivität. Anpassbar für kleine bis mittlere Unternehmen. Verbessern Sie Effizienz und fördern Sie Innovation in Ihrem Arbeitsablauf.",
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
  "nav.settings.prompts": "Prompts",
  "nav.settings.instructions": "Instructions",
  "nav.settings.knowledge-base": "Knowledge Base",
  "nav.settings.categories": "Kategorien",
  "login.welcome": "Willkommen bei der",
  "login.title": "In Ihr Konto einloggen",
  "login.email": "E-Mail",
  "login.password": "Passwort",
  "login.submit": "Anmelden",
  "welcome.title": "KI für einfache und effiziente Geschäftsabläufe",
  "welcome.text": "aibox wurde entwickelt, um interne Aufgaben zu optimieren und die Produktivität in Arbeitsabläufen zu steigern. Unsere Lösung ist perfekt für kleine bis mittelgroße Unternehmen und lässt sich an Ihre Bedürfnisse anpassen, um Effizienz voranzutreiben und Innovation zu fördern.",
  "welcome.get-started": "Los geht's",
  "welcome.explore": "Mehr Widgets entdecken",
  "prompt-library.prompts.title": "Prompt Management",
  "prompt-library.prompts.add": "Neuer Prompt",
  "prompt-library.prompts.edit": "Eingabeaufforderung bearbeiten",
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
  "prompt-library.add.prompts.saving": "Speichern...",
  "prompt-library.instructions.title": "Instruction Management",
  "prompt-library.instructions.add": "Anweisung hinzufügen",
  "prompt-library.instructions.edit": "Anweisung bearbeiten",
  "prompt-library.instructions.all": "Alle Anweisungen",
  "prompt-library.instructions.view": "View",
  "prompt-library.add.instructions.title": "Titel der Anweisung",
  "prompt-library.add.instructions.text": "Anweisungstext",
  "prompt-library.add.instructions.save": "Anleitung speichern",
  "prompt-library.knowledgebase.title": "Knowledge Base Management",
  "prompt-library.knowledgebase.add": "Add knowledge base",
  "prompt-library.knowledgebase.edit": "Edit knowledge base",
  "prompt-library.knowledgebase.all": "All knowledge base",
  "prompt-library.knowledgebase.view": "View",
  "prompt-library.add.knowledgebase.title": "Knowledge base title",
  "prompt-library.add.knowledgebase.text": "Knowledge base text",
  "prompt-library.add.knowledgebase.save": "Save knowledge base",
  "prompt-library.categories.title": "Kategorien",
  "prompt-library.categories.add": "Neue Kategorie",
  "prompt-library.categories.edit": "Kategorie bearbeiten",
  "prompt-execution.card.showMore": "weitere Anregungen",
  "prompt-execution.card.showLess": "weniger Aufforderungen"
};
const ui = {
  en,
  de: { ...en, ...de }
};

const getLang = (s) => {
  if (s && s in ui) return s;
};
function useTranslations(requestedLang) {
  const lang = getLang(requestedLang);
  return function t(key) {
    return lang && ui[lang][key] || ui[defaultLang][key] || "";
  };
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Head = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Head;
  const { title, description } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>', '</title><meta name="descrption"', '><link rel="stylesheet" href="https://fonts.upset.dev/css2?family=Inter:wght@100..900&display=swap"><script>\n    /* We set the theme in a render blocking script tag early to avoid flashing */\n    const theme = localStorage.getItem("theme");\n    if (theme) {\n      document.documentElement.setAttribute("data-theme", theme);\n    }\n  <\/script>', "</head>"])), title, addAttribute(description, "content"), renderHead());
}, "/home/steven/work/ai-toolbox/src/layouts/Head.astro", void 0);

export { $$Head as $, useTranslations as u };
