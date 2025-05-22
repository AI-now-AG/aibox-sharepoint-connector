import type { APIRoute } from "astro";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET: APIRoute = async (ctx) => {
  // Optional: Parse incoming data (e.g., from a form)
  const data = {};

  // Replace this with your actual Make webhook URL
  const makeWebhookUrl =
    "https://hook.eu2.make.com/bmelsaimk76v4eunf7sbcs2ioeh82u1f";

  // Forward the data to the Make.com webhook
  const response = await fetch(makeWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return Response.json(
    { data: response },
    {
      status: response.ok ? 200 : response.status,
    },
  );
};
