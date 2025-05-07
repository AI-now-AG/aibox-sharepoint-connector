import Mustache, { type OpeningAndClosingTags } from "mustache";
import { ui, defaultLang } from "./ui";

let currentLang: string;

// custom tags
const customTags: OpeningAndClosingTags = ["${", "}"];
Mustache.tags = customTags;

export function getLanguage() {
  return currentLang || defaultLang;
}

export function setLanguage(lang: string) {
  currentLang = lang;
}

export function useTranslations(requestedLang?: string) {
  const value = (requestedLang || currentLang) as string;
  const lang = value && value in ui ? (value as keyof typeof ui) : defaultLang;

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

export function getLanguageData(lang: string) {
  // Check if the provided lang exists in the ui object
  if (lang in ui) {
    return ui[lang as keyof typeof ui];
  }

  // If the lang is not found, fall back to the default language
  console.warn(
    `Language "${lang}" not found. Falling back to default language: "${defaultLang}".`,
  );
  return ui[defaultLang];
}
