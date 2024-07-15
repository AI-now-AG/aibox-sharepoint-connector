import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

export const model = new ChatOpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
  model: "gpt-4o",
});

export async function getHeadline(prompt: string, instructionText: string, text: string) {
  const messages = [
    new SystemMessage(prompt),
    new SystemMessage(instructionText),
    new SystemMessage("Ensure that the response is properly structured."),
    new HumanMessage(text),
  ];
  await model.invoke(messages);
  const parser = new StringOutputParser();
  const result = await model.invoke(messages);
  const outputObj = await parser.invoke(result);
  return outputObj;
}
