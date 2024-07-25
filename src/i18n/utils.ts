import { ui, defaultLang } from "./ui";

export function useTranslations(lang?: string) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return (lang && ui[lang][key]) || ui[defaultLang][key];
  };
}
