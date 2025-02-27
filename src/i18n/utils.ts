import Mustache, { type OpeningAndClosingTags } from "mustache";
import { ui, defaultLang } from "./ui";

let currentLang: string;

// custom tags
const customTags: OpeningAndClosingTags = ["${", "}"];
Mustache.tags = customTags;

export function getLanguage(lang?: string) {
  if (lang && lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function setLanguage(lang: string) {
  currentLang = lang;
}

export function useTranslations(requestedLang?: string) {
  const value = requestedLang || currentLang;
  const lang = getLanguage(value);

  return function t(key: keyof (typeof ui)[typeof defaultLang], view?: object) {
    const template =
      (lang && (ui[lang] as Record<string, string>)[key]) ||
      (ui[defaultLang] as Record<string, string>)[key];

    if (typeof template === "undefined") {
      console.warn(`i18n missing translation key: ${key}`);
      return `[missing key: ${key}]`;
    }

    return Mustache.render(template, view);
  };
}
