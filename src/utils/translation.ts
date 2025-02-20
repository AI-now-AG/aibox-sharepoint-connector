import log from "./log";
import de from "../i18n/de.json";
import en from "../i18n/en.json";
import fr from "../i18n/fr.json";
import it from "../i18n/it.json";
import convertEN from "../i18n/support/convert-en.json";
import convertDE from "../i18n/support/convert-de.json";
import convertFR from "../i18n/support/convert-fr.json";
import convertIT from "../i18n/support/convert-it.json";

/*
 * ON/OFF this flag to suport text translate in the app. This use for dev only on User Selection screen
 */
export const IS_SUPPORTING_TRANSLATION_INTEGRATION = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translationGetters: any = {
  de: de,
  en: en,
  fr: fr,
  it: it,
};
const DEFAULT_LANGUAGE = "en";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrimitiveJsonValue = string | number | boolean | any;
type JsonValue =
  | PrimitiveJsonValue
  | { [key: string]: JsonValue }
  | JsonValue[];
type FlattenedJson = { [key: string]: PrimitiveJsonValue };
type NestedJson = { [key: string]: NestedJson | string };
type LangType = "en" | "de" | "fr" | "it";

export function flattenJson(
  obj: JsonValue,
  parentKey: string = "",
  separator: string = ".",
): FlattenedJson {
  const flattened: FlattenedJson = {};

  if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = parentKey ? `${parentKey}${separator}${key}` : key;
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        Object.assign(flattened, flattenJson(value, fullKey, separator));
      } else if (!Array.isArray(value)) {
        flattened[fullKey] = value;
      }
    }
  }

  return flattened;
}

export function getFlattenedTextTranslateList(
  lang: LangType = DEFAULT_LANGUAGE,
) {
  const flattenedJson = flattenJson(translationGetters[lang]);
  return flattenedJson;
}

export function separateKeyValueFrom(flattenedTranslationList: FlattenedJson) {
  const keys: string[] = [];
  const values: PrimitiveJsonValue[] = [];
  for (const [key, value] of Object.entries(flattenedTranslationList)) {
    keys.push(key);
    values.push(value);
  }
  return { keys, values };
}

export function getListKeyTransalation(
  lang: LangType = DEFAULT_LANGUAGE,
): Array<string> {
  const flattenedJson = getFlattenedTextTranslateList(lang);
  const { keys } = separateKeyValueFrom(flattenedJson);
  return keys;
}

export function getListValueTransalation(
  lang: LangType = DEFAULT_LANGUAGE,
): Array<string> {
  const flattenedJson = getFlattenedTextTranslateList(lang);
  const { values } = separateKeyValueFrom(flattenedJson);
  return values;
}

export function logListKey(lang: LangType = DEFAULT_LANGUAGE) {
  const listKey: Array<string> = getListKeyTransalation(lang);
  let language = "ENGLISH";
  switch (lang) {
    case "de":
      language = "GERMAN";
      break;
    case "fr":
      language = "FRENCH";
      break;
    case "it":
      language = "ITALIAN";
      break;
    default:
      language = "ENGLISH";
      break;
  }
  log.i(
    language +
      "--------------- LIST KEY FOR EXCEL TRANSLATION - START ---------------",
  );
  listKey.forEach((key) => {
    console.log(key);
  });
  log.d(listKey.length, "TOTAL LIST KEY: ");
  log.i(
    language +
      "--------------- LIST KEY FOR EXCEL TRANSLATION - END ---------------",
  );
}

export function logListValue(lang: LangType = DEFAULT_LANGUAGE) {
  const listValue: Array<string> = getListValueTransalation(lang);
  let language = "ENGLISH";
  switch (lang) {
    case "de":
      language = "GERMAN";
      break;
    case "fr":
      language = "FRENCH";
      break;
    case "it":
      language = "ITALIAN";
      break;
    default:
      language = "ENGLISH";
      break;
  }
  log.i(
    language +
      "--------------- LIST VALUE FOR EXCEL TRANSLATION - START ---------------",
  );
  listValue.forEach((value) => {
    console.log(value);
  });
  log.d(listValue.length, language + "- TOTAL LIST VALUE: ");
  log.i(
    language +
      "--------------- LIST VALUE FOR EXCEL TRANSLATION - END ---------------",
  );
}

export function logENListKey() {
  logListKey("en");
}

export function logDEListKey() {
  logListKey("de");
}

export function logFRListKey() {
  logListKey("fr");
}

export function logITListKey() {
  logListKey("it");
}

export function logENListValue() {
  logListValue("en");
}

export function logDEListValue() {
  logListValue("de");
}

export function logFRListValue() {
  logListValue("fr");
}

export function logITListValue() {
  logListValue("it");
}

export function logALLListValue() {
  logENListValue();
  logDEListValue();
  logFRListValue();
  logITListValue();
}

export function logALLListKeyAndValue() {
  logENListKey();
  logDEListKey();
  logFRListKey();
  logITListKey();

  logENListValue();
  logDEListValue();
  logFRListValue();
  logITListValue();
}

export function unflattenJson(flattened: FlattenedJson): NestedJson {
  const result: NestedJson = {};

  Object.keys(flattened).forEach((flatKey) => {
    const value = flattened[flatKey];
    const keys = flatKey.split(".");
    let currentLevel = result;
    keys.slice(0, -1).forEach((key) => {
      if (!(key in currentLevel) || typeof currentLevel[key] !== "object") {
        currentLevel[key] = {};
      }
      currentLevel = currentLevel[key] as NestedJson;
    });
    const lastKey = keys[keys.length - 1];
    currentLevel[lastKey] = value;
  });
  return result;
}

export function logConvertedToFormatedJsonTranslation(
  lang: LangType = DEFAULT_LANGUAGE,
) {
  let language = "ENGLISH";
  let convertTransaltion = convertEN;
  switch (lang) {
    case "de":
      convertTransaltion = convertDE;
      language = "GERMAN";
      break;
    case "fr":
      convertTransaltion = convertFR;
      language = "FRENCH";
      break;
    case "it":
      convertTransaltion = convertIT;
      language = "ITALIAN";
      break;
    default:
      convertTransaltion = convertEN;
      language = "ENGLISH";
      break;
  }

  const convertedJsonTranslation = unflattenJson(convertTransaltion);
  log.i(
    language +
      "---------------DEV FORMATED TRANSLATION - START ---------------",
  );
  log.d(convertedJsonTranslation);
  log.i(
    language + "---------------DEV FORMATED TRANSLATION - END ---------------",
  );
}

export function logENConvertedToFormatedJsonTranslation() {
  logConvertedToFormatedJsonTranslation("en");
}

export function logDEConvertedToFormatedJsonTranslation() {
  logConvertedToFormatedJsonTranslation("de");
}

export function logFRConvertedToFormatedJsonTranslation() {
  logConvertedToFormatedJsonTranslation("fr");
}

export function logITConvertedToFormatedJsonTranslation() {
  logConvertedToFormatedJsonTranslation("it");
}

export function logALLConvertedToFormatedJsonTranslation() {
  logENConvertedToFormatedJsonTranslation();
  logDEConvertedToFormatedJsonTranslation();
  logFRConvertedToFormatedJsonTranslation();
  logITConvertedToFormatedJsonTranslation();
}
