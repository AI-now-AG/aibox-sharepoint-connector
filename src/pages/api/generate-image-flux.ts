import { decrypt } from "$utils/secure";
import type { APIContext, APIRoute } from "astro";
import { fal } from "@fal-ai/client";
import type { ImageSize } from "@fal-ai/client/endpoints";
import { ApiKeyProvider } from "$types/TenantFeature";
import { UsageType } from "$types/UsageTracking";
import UsageLogModel, { type UsageLog } from "$data/models/usageLog.model";

const recordImageUsage = async (ctx: APIContext) => {
  try {
    const usage: Partial<Omit<UsageLog, "_id">> = {
      tenant_id: ctx.locals.tenant._id,
      provider: ApiKeyProvider.Flux,
      model: "fal-ai/flux/dev",
      type: UsageType.Image,
    };

    await UsageLogModel.create(usage);
  } catch (error) {
    console.error("Error recording image usage:", error);
  }
};

export const POST: APIRoute = async (ctx: APIContext) => {
  const { request } = ctx;
  try {
    if (!ctx.locals.tenant?.fal_ai_api_key) {
      console.log("fal_ai_api_key", ctx.locals.tenant?.fal_ai_api_key);
      return new Response(
        JSON.stringify({ error: "Missing FAL.AI's API Key!!!" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const apiKey = decrypt(ctx.locals.tenant?.fal_ai_api_key || "");
    fal.config({
      credentials: apiKey,
    });

    const formData = await request.formData();
    const prompt = formData.get("prompt") as string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let imageSize = formData.get("image_size") as any;
    if (imageSize == "custom") {
      const width = parseInt(formData.get("custom_width") as string, 10);
      const height = parseInt(formData.get("custom_height") as string, 10);
      imageSize = { width, height } as ImageSize;
    }

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("FLUX/DEV ::: START TIME", Date.now());
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt,
        image_size: imageSize,
        num_images: 1,
      },
    });
    console.log("FLUX/DEV ::: HAS RESULT", result);

    const imageUrl = result.data.images[0].url;
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    console.log("FLUX/DEV ::: END TIME", Date.now());

    setTimeout(() => {
      recordImageUsage(ctx);
    }, 0);

    return new Response(JSON.stringify({ image: base64Image }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating image with fal-ai/flux/dev:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate image: " + error }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
