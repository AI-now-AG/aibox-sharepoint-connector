import PDFParser from "pdf2json";
import mammoth from "mammoth";

// Function to extract text from PDF
export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    // Error Handling
    pdfParser.on("pdfParser_dataError", (errData) =>
      reject(errData.parserError),
    );

    // Data Parsing
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      // Extract text from each page
      const text = pdfData.Pages.map((page: any) =>
        page.Texts.map((textObj: any) =>
          decodeURIComponent(textObj.R[0].T),
        ).join(" "),
      ).join("\n");

      resolve(text);
    });

    // Convert File object to Buffer (Node.js way)
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
  return result.value || "No text found in DOCX.";
};

// Function to extract text from TXT
export const extractTextFromTxt = async (file: File): Promise<string> => {
  const text = await file.text();
  return text.replace(/\n/g, "<br>"); // Convert line breaks to <br> for HTML
};
