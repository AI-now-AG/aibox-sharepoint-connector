import { type Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    return {
      statusCode: 200,
      body: JSON.stringify({
        apiUrl: process.env.INTEGRATION_API_URL || "",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to get integration configuration" + error,
      }),
    };
  }
};
