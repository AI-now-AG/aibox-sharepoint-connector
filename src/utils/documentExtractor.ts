import pdf from "pdf-parse-debugging-disabled";
import mammoth from "mammoth";

// Function to extract text from PDF
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const data = await pdf(buffer);

    // Convert newlines to <br> for HTML
    return data.text.trim().replace(/\n/g, "<br>");
  } catch (error) {
    throw new Error(`Error extracting text from PDF: ${error}`);
  }
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
