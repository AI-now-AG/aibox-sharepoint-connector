import "dotenv/config";
import fs from "fs";
import xlsx from "xlsx";

// 1. Load JSON translation files
const loadTranslations = () => {
  const languages = ["en", "de", "fr", "it"];
  const translations = {};

  languages.forEach((lang) => {
    const data = JSON.parse(fs.readFileSync(`./src/i18n/${lang}.json`, "utf8"));
    translations[lang] = data;
  });

  return translations;
};

// 2. Flatten Nested JSON
const flattenObject = (obj, parentKey = "", result = {}) => {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  }
  return result;
};

// 3. Generate Excel-compatible data
const generateExcelData = (translations) => {
  const keys = Object.keys(flattenObject(translations.en)); // Use EN as the base
  const rows = [["Key", "EN (Default)", "DE", "FR", "IT"]]; // Header row

  for (const key of keys) {
    rows.push([
      key,
      translations.en[key] || "",
      translations.de[key] || "",
      translations.fr[key] || "",
      translations.it[key] || "",
    ]);
  }

  return rows;
};

// 4. Write Excel file
const writeExcelFile = (data) => {
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Translations");
  xlsx.writeFile(workbook, "./dist/translations.xlsx");
};

// 5. Export Translations to Excel
const exportToExcel = () => {
  const translations = Object.fromEntries(
    Object.entries(loadTranslations()).map(([lang, obj]) => [
      lang,
      flattenObject(obj),
    ]),
  );
  const data = generateExcelData(translations);
  writeExcelFile(data);
  console.log("Translations exported to translations.xlsx");
};

exportToExcel();
