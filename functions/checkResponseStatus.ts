import { type Handler } from "@netlify/functions";
import ResponseModel from "$data/models/response.model";

const checkResponseStatus: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  const uniqueId = event.queryStringParameters?.uid || "";

  try {
    const task = await ResponseModel.get(uniqueId);
    if (!task) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: "Task not found",
        }),
      };
    }

    const {
      status,
      tools,
      response_id: responseId,
      output_text: outputText,
      error,
    } = task;

    return {
      statusCode: 200,
      body: JSON.stringify({ status, outputText, tools, responseId, error }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error during check response status:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error?.message || "Internal Server Error",
      }),
    };
  }
};

export { checkResponseStatus as handler };
