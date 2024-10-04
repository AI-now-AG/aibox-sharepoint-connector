import { I18n } from "i18n";
import path from "path";

// global object
var i18nGlobal = {};

// directory
const __dirname = path.resolve();
const localeDirectory = path.join(__dirname, "/src/locales");

// create a new instance
const i18n = new I18n();

// later in code configure
i18n.configure({
  locales: ["en", "de"],
  defaultLocale: "en",
  directory: localeDirectory,
  register: global,
  mustacheConfig: {
    tags: ["{", "}"],
    disable: false,
  },
  updateFiles: false,
  objectNotation: true,
});

export default i18n;
