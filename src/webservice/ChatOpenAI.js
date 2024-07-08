import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

export const model = new ChatOpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
  model: "gpt-4o",
});

export async function getHeadline(text) {
  const messages = [
    new SystemMessage(
      "Please generate three possible titles for a news site that aims to cover a broad range of topics, from follwing contents.",
    ),
    new SystemMessage("Make sure each title start with new line."),
    new HumanMessage(text),
  ];
  await model.invoke(messages);
  const parser = new StringOutputParser();
  const result = await model.invoke(messages);
  const outputObj = await parser.invoke(result);
  return outputObj;
}
