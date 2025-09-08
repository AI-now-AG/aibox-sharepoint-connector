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

// [Example] url = "https://ainowstorage.blob.core.windows.net/fileuploadcontainer/ai-now-dev/1e681dd5-5541-420b-a9f6-8166c1c2b204-19_2_24_MAC_MINI.docx?sv=2025-05-05&se=2025-09-08T09%3A13%3A57Z&sr=b&sp=r&sig=ZvtgSZXDYILwFSbnJjZ5uVzmqifHxOQwE5AfqeHlc44%3D";
export function getFileNameFromAzureUrl(url: string): string | null {
    try {
        // Decode the URL to handle encoded characters
        const decodedUrl = decodeURIComponent(url);
        
        // Split the URL by '/' and get the last part
        const parts = decodedUrl.split('/');
        
        // The file name is typically the last part after the last '/'
        const fileNameWithParams = parts[parts.length - 1];
        
        // Remove query parameters if they exist
        const fileNameWithGuid = fileNameWithParams.split('?')[0];
        
        // Extract the file name after the GUID prefix (36 chars for GUID + 1 for '-')
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/;
        const fileName = fileNameWithGuid.replace(guidRegex, '');
        
        return fileName || null;
    } catch (error) {
        console.error('Error extracting file name:', error);
        return null;
    }
}