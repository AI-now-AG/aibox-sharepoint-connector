import PDFParser from "pdf2json";
import mammoth from "mammoth";

// Function to extract text from PDF
export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    // Handle Errors
    pdfParser.on("pdfParser_dataError", (errData) =>
      reject(errData.parserError),
    );

    // Process Extracted Text
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      let text = "";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfData.Pages.forEach((page: any) => {
        const lines: { [key: number]: string[] } = {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        page.Texts.forEach((textObj: any) => {
          const y = Math.round(textObj.y); // Use Y-coordinate for line detection
          const extractedText = decodeURIComponent(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            textObj.R.map((r: any) => r.T)
              .join("")
              .replace(/%20(.)%20/g, "$1"),
          );

          if (!lines[y]) {
            lines[y] = [];
          }
          lines[y].push(extractedText);
        });

        // Sort by Y-position and reconstruct lines
        Object.keys(lines)
          .sort((a, b) => Number(a) - Number(b))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .forEach((y: any) => {
            text += lines[y].join("") + "\n"; // Preserve line breaks
          });
      });

      // Convert newlines to <br> for HTML
      resolve(text.trim().replace(/\n/g, "<br>"));
    });

    // Convert File to Buffer
    file
      .arrayBuffer()
      .then((arrayBuffer) => {
        const buffer = Buffer.from(arrayBuffer);
        pdfParser.parseBuffer(buffer);
      })
      .catch((err) => reject(err));
  });
};

// Function to extract text from DOCX
export const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({
    buffer: Buffer.from(arrayBuffer),
  });

  // **Explicitly remove any remaining <img> tags**
  const extractedText = result.value.replace(/<img[^>]*>/g, "");

  return extractedText || "No text found in DOCX.";
};

// Function to extract text from TXT
export const extractTextFromTxt = async (file: File): Promise<string> => {
  const text = await file.text();
  return text.replace(/\n/g, "<br>"); // Convert line breaks to <br> for HTML
};
