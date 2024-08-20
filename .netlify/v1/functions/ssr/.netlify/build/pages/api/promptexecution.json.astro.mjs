import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { P as PromptModel } from '../../chunks/prompt.model_CneM5GzG.mjs';
import { I as InstructionModel } from '../../chunks/instruction.model_BxQBp-yu.mjs';
import { K as KnowledgeBaseModel } from '../../chunks/knowledgeBase.model_DXrPTi6X.mjs';
export { renderers } from '../../renderers.mjs';

const model = new ChatOpenAI({
  apiKey: "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",
  model: "gpt-4o"
});
const POST = async (ctx) => {
  try {
    const encoder = new TextEncoder();
    const params = await ctx.request.json();
    if (!params.promptId) {
      return new Response(
        JSON.stringify({
          message: "Require 'PromptId' field"
        }),
        { status: 400 }
      );
    }
    if (!params.article) {
      return new Response(
        JSON.stringify({
          message: "Require 'article' field"
        }),
        { status: 400 }
      );
    }
    const prompt = await PromptModel.get(params.promptId);
    if (!prompt?.prompt) {
      return new Response(
        JSON.stringify({
          message: "Prompt field not defined"
        }),
        { status: 400 }
      );
    }
    const messages = [];
    if (prompt?.instructions) {
      const calls = prompt.instructions.map(async (inst) => {
        const instruction = await InstructionModel.get(inst.toString());
        return instruction;
      });
      const instructions = await Promise.all(calls);
      instructions.forEach((instruction) => {
        if (instruction?.instruction) {
          messages.push(new SystemMessage(instruction.instruction));
        }
      });
    }
    if (prompt?.knowledgebase) {
      const calls = prompt.knowledgebase.map(async (kb) => {
        const instruction = await KnowledgeBaseModel.get(kb.toString());
        return instruction;
      });
      const knowledgebases = await Promise.all(calls);
      knowledgebases.forEach((knowledgebase) => {
        if (knowledgebase?.knowledge_base) {
          messages.push(new SystemMessage(knowledgebase.knowledge_base));
        }
      });
    }
    messages.push(new HumanMessage(params.article));
    if (params.images) {
      params.images.forEach((object) => {
        if (object.content) {
          messages.push(
            new HumanMessage(object.content)
            // new HumanMessage({
            //   content: [
            //     {
            //       type: "image_url",
            //       image_url: {
            //         url: object.content,
            //       },
            //     },
            //   ],
            // }),
          );
        }
      });
    }
    if (params.files) {
      params.files.forEach((object) => {
        if (object.content) {
          messages.push(
            new HumanMessage({
              content: [
                {
                  type: "text",
                  // TODO: make this dynamically change as needed
                  text: object.content
                }
              ]
            })
          );
        }
      });
    }
    const parser = new StringOutputParser();
    const headers = new Headers();
    headers.set("Content-Type", "text/plain; charset=UTF-8");
    headers.set("Transfer-Encoding", "chunked");
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    (async () => {
      try {
        const stream = await model.pipe(parser).stream(messages);
        let partialChunk = "";
        for await (const chunk of stream) {
          partialChunk += chunk;
          let lastCompleteCharIndex = partialChunk.length;
          try {
            encoder.encode(partialChunk);
          } catch {
            lastCompleteCharIndex = Buffer.byteLength(partialChunk) - 1;
          }
          const validChunk = partialChunk.slice(0, lastCompleteCharIndex);
          partialChunk = partialChunk.slice(lastCompleteCharIndex);
          if (validChunk) {
            await writer.write(encoder.encode(validChunk));
          }
        }
      } catch (error) {
        console.error();
        await writer.write(
          encoder.encode("Error processing chunks:" + error + "\n")
        );
      } finally {
        writer.close();
      }
    })();
    return new Response(readable, {
      headers
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        message: "Internal Server Error: " + error
      }),
      { status: 500 }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  model
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
