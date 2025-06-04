// import { TextLoader } from "langchain/document_loaders/fs/text";
// import { CSVLoader } from "langchain/document_loaders/fs/csv";
// import { SRTLoader } from "@langchain/community/document_loaders/fs/srt";
// import { JSONLoader } from "langchain/document_loaders/fs/json";
import { type FileInput } from "$types/FileInput";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export const fileLoader = async (file: FileInput) => {
  if (file.type.includes("pdf")) {
    const buf = Buffer.from(file.content.split(",")[1], "base64");
    const pdf = new Blob([buf], {
      type: "application/pdf",
    });

    const loader = new PDFLoader(pdf, {
      parsedItemSeparator: " ",
    });

    const docs = await loader.load();

    return docs;
  }
};
