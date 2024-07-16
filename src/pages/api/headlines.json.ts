import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { APIRoute } from "astro";

export const model = new ChatOpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
  model: "gpt-4o",
});

const promptText = `Create three headlines for a Swiss press article in german language. The article covers the following topic. Ensure that the headlines align with the style and expectations of Swiss press articles and your knowledge base. Follow the specific instructions provided.

Focus on the core and central message of the article and incorporate SEO best practices for writing headlines.

Respond with a HTML ol following exactly this format:
<ol class="ml-4 list-decimal">
<li>First headline</li>
<li>Second headline</li>
<li>Third headline</li>
</ol>
`;

import { TextLoader } from "langchain/document_loaders/fs/text";
const loader = new TextLoader("src/data/somedia_instruction.txt");
const docs = await loader.load();

export const GET: APIRoute = async ({ url }) => {
  // tmp
  if (url.searchParams.has("prompt")) {
    return new Response(
      JSON.stringify({
        instructions: docs[0].pageContent,
        prompt: promptText,
      }),
    );
  }

  if (!url.searchParams.has("article")) {
    return new Response(
      JSON.stringify({
        error: "foo",
      }),
    );
  }

  const article = url.searchParams.get("article") as string;

  const messages = [
    new SystemMessage(promptText),
    new SystemMessage(docs[0].pageContent),
    new HumanMessage(article),
  ];

  const parser = new StringOutputParser();
  const result = await model.invoke(messages);
  const headlines = await parser.invoke(result);

  return new Response(
    JSON.stringify({
      headlines,
    }),
  );
};
