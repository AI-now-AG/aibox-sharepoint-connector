import { defineAction } from "astro:actions";
import { z } from "zod";
import { ObjectId } from "mongodb";
import KnowledgeBaseModel from "$data/models/knowledgeBase.model";
import { transformRawData } from "$utils/transformRawData";
import {
  extractTextFromPDF,
  extractTextFromDocx,
  extractTextFromTxt,
} from "$utils/documentExtractor";

export const knowledgeBase = {
  listByTenant: defineAction({
    input: z.object({
      tenant_id: z.string(),
    }),
    handler: async (input) => {
      const id = new ObjectId(input.tenant_id);
      const knowledgeBases = await KnowledgeBaseModel.listByTenant(id);
      return transformRawData(knowledgeBases, false);
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
        if (["application/pdf"].includes(file.type)) {
          text = await extractTextFromPDF(file);
        }

        if (
          [
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ].includes(file.type)
        ) {
          text = await extractTextFromDocx(file);
        }

        if (["text/plain"].includes(file.type)) {
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
