import { type Handler } from "@netlify/functions";
import ImageTaskModel from "$data/models/imageTask.model";

const gptImageCheckStatus: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  const uniqueId = event.queryStringParameters?.uid || "";

  try {
    const task = await ImageTaskModel.get(uniqueId);
    if (!task) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: "Job not found",
        }),
      };
    }

    const { status, image_url: imageUrl, response_id: responseId } = task;

    return {
      statusCode: 200,
      body: JSON.stringify({ status, imageUrl, responseId }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error during check GPT image status:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error?.message || "Internal Server Error",
      }),
    };
  }
};

export { gptImageCheckStatus as handler };
