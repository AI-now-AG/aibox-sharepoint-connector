import { defineAction } from "astro:actions";
import { z } from "zod";
//import pdf from "pdf-parse";
import mammoth from "mammoth";
import { ObjectId } from "mongodb";
import KnowledgeBaseModel from "$data/models/knowledgeBase.model";
import { transformRawDataWithoutReplacer } from "$utils/transformRawData";

// Function to extract text from PDF
// const extractTextFromPDF = async (file: File): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();

//     reader.onload = async () => {
//       try {
//         const buffer = Buffer.from(reader.result as ArrayBuffer);
//         const data = await pdf(buffer);
//         resolve(data.text);
//       } catch (error) {
//         reject(error);
//       }
//     };

//     reader.onerror = () => reject(new Error("Failed to read PDF file."));

//     reader.readAsArrayBuffer(file);
//   });
// };

// Function to extract text from DOCX
const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({
    buffer: Buffer.from(arrayBuffer),
  });
  return result.value || "No text found in DOCX.";
};

// Function to extract text from TXT
const extractTextFromTxt = async (file: File): Promise<string> => {
  return await file.text();
};

export const knowledgebase = {
  listByTenant: defineAction({
    input: z.object({
      tenant_id: z.string(),
    }),
    handler: async (input) => {
      const id = new ObjectId(input.tenant_id);
      const knowledgeBaseCursor = await KnowledgeBaseModel.listByTenant(id);
      const knowledgeBases = await knowledgeBaseCursor.toArray();
      return transformRawDataWithoutReplacer(knowledgeBases);
    },
  }),

  extractFileContent: defineAction({
    accept: "form",
    input: z.object({
      file: z.instanceof(File),
    }),
    handler: async (input) => {
      try {
        const { file } = input;

        // Extract text based on file type
        let text = "";
        if (file.type === "application/pdf") {
          //text = await extractTextFromPDF(file);
        } else if (
          file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          text = await extractTextFromDocx(file);
        } else if (file.type === "text/plain") {
          text = await extractTextFromTxt(file);
        }

        return { text };
      } catch (error) {
        console.error("Error processing file:", error);
        throw error;
      }
    },
  }),
};
