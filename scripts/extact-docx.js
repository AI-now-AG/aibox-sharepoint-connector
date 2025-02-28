import fs from "fs";
import mammoth from "mammoth";

async function convertDocxToHtml(docxPath) {
  try {
    const buffer = fs.readFileSync(docxPath);
    const result = await mammoth.convertToHtml({
      buffer,
      convertImage: mammoth.images.none, // Skip image conversion
    });

    // **Explicitly remove any remaining <img> tags**
    let cleanHtml = result.value.replace(/<img[^>]*>/g, "");

    console.log("Extracted HTML:", cleanHtml);
    return cleanHtml;
  } catch (error) {
    console.error("Error extracting DOCX:", error);
  }
}

// Example Usage
convertDocxToHtml("./scripts/sample.docx").then((html) => {
  fs.writeFileSync("./scripts/output-docx.html", html);
  console.log("✅ DOCX converted to HTML successfully!");
});
