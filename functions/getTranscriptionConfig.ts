import { type Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Return the configuration
    return {
      statusCode: 200,
      body: JSON.stringify({
        apiKey: process.env.TRANSCRIPTION_API_KEY,
        apiUrl: process.env.TRANSCRIPTION_API_URL
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get transcription configuration'+ error })
    };
  }
};
