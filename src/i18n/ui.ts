import de from "./de.json";
import en from "./en.json";
import fr from "./fr.json";
import it from "./it.json";

export const languages = {
  en: "English",
  de: "Deutsch",
};

export const defaultLang = "en";
export const ui = { en, de, fr, it } as const;
