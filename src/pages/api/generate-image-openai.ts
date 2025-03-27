import { decrypt } from "$utils/secure";
import type { APIRoute } from "astro";
import { OpenAI } from "openai";

export const POST: APIRoute = async (ctx) => {
  const { request } = ctx;

  try {
    const apiKey = decrypt(ctx.locals.tenant?.openai_api_key || "");
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const formData = await request.formData();
    const prompt = formData.get("prompt") as string;
    const size =
      (formData.get("size") as
        | "1024x1024"
        | "256x256"
        | "512x512"
        | "1792x1024"
        | "1024x1792") || "1024x1024";
    const quality =
      (formData.get("quality") as "standard" | "hd") || "standard";

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      quality,
      response_format: "b64_json",
    });

    console.log("Generated image with DALL-E 3 RESPONSE:", response.data[0]);

    const image = response.data[0].b64_json;

    return new Response(JSON.stringify({ image }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating image with DALL-E 3:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate image: " + error }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
