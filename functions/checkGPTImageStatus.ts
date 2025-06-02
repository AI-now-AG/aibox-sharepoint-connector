import { type Handler } from "@netlify/functions";
import ImageTaskModel from "$data/models/imageTask.model";

const checkGPTImageStatus: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  const jobId = event.queryStringParameters?.jobId || "";

  try {
    const job = await ImageTaskModel.get(jobId);
    if (!job) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: "Job not found",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ status: job.status, imageUrl: job.imageUrl }),
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

export { checkGPTImageStatus as handler };
