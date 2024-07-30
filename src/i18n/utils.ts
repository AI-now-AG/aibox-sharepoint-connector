import { ui, defaultLang } from "./ui";

const getLang = (s?: string) => {
  if (s && s in ui) return s as keyof typeof ui;
};

export function useTranslations(requestedLang?: string) {
  const lang = getLang(requestedLang);
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return (lang && ui[lang][key]) || ui[defaultLang][key] || "";
  };
}
