import { google } from "googleapis";
import fs from "fs/promises"; // ES6 `fs` with promises for async/await

const SHEET_ID = "1DyGvNnWWoqfwVVa1PNNQgx1D6ewT7pQgf4mHMQuFAZQ"; // Your Google Sheet ID: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit).
const API_KEY = "AIzaSyCP3Ogg96BqSSTw-671onx7TuJNUN9xdyY"; // Your Google API key
const RANGE = "AIBOX (Master)"; // The name of the sheet/tab

const fetchTranslations = async () => {
  const sheets = google.sheets({ version: "v4" });

  try {
    // Fetch data from the Google Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
      key: API_KEY, // Use API key here
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No data found.");
      return;
    }

    // Extract the header (translations) and keys
    // Column headers: DEV_OK | TRANSLATOR_OK | KEY | EN - Translator | DE - Translator | FR - Translator | IT - Translator
    const headers = rows[0].slice(3, 7); // Skip the first three columns (DEV_OK, TRANSLATOR_OK, KEY)
    const data = rows.slice(1); // Skip the header row

    // Create JSON files for each language
    console.log("headers", headers);
    await Promise.all(
      headers.map(async (lang, index) => {
        const translations = {};

        data.forEach((row) => {
          const key = row[2]; // Get the translation key from the 3rd column (KEY)
          const translation = row[index + 3]; // Match the translation column index (starting at 3rd column)

          if (key && translation) {
            translations[key] = translation;
          }
        });

        // Save to file
        const locale = lang.split(" ")[0]?.toLowerCase();
        const filePath = `./src/i18n/${locale}.json`; // Use only the language code as file name (e.g., "EN.json")
        await fs.writeFile(
          filePath,
          JSON.stringify(translations, null, 2),
          "utf8",
        );
        console.log(`Updated: ${filePath}`);
      }),
    );
  } catch (error) {
    console.error("Error fetching translations:", error);
  }
};

// Run the function
await fetchTranslations();
