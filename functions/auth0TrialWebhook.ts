/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from "@netlify/functions";
import UserModel from "$data/models/user.model";

/**
 * Handles Auth0 log stream events
 * Reference: https://auth0.com/docs/customize/log-streams/event-filters#user-behavioral-success
 *
 * @param {Object} event - Incoming event payload from Auth0.
 * @returns {Object} - HTTP response indicating success or failure.
 */
const auth0TrialWebhook: Handler = async (
  event: HandlerEvent,
): Promise<HandlerResponse> => {
  try {
    // Ensure the request is from Auth0 (validate secret, IP, or header signature)
    const authHeader = event.headers["authorization"];

    if (
      !authHeader ||
      authHeader !== `Bearer ${process.env.AUTH0_LOG_SECRET}`
    ) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    // Parse the incoming Auth0 webhook data
    const payload = JSON.parse(event.body || "{}");
    const { logs } = payload;

    // Handle each event type
    for (const log of logs) {
      const { data } = log;
      const { type: eventType, description } = data;

      console.log(
        `Event log: ${eventType} / ${description || "-"}`,
        JSON.stringify(log),
      );

      // Trigger successful signup
      // See: https://auth0.com/docs/customize/log-streams/event-filters#signup-success
      if (eventType == "ss") {
        if (isDatabaseConnection(data)) {
          const { user_id: userId } = data;
          const { email, is_signup: isSignup } = data.details.body || {};
          if (isSignup && email) {
            await triggerTrialWorkflow(userId, email);
          }
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Success" }),
    };
  } catch (error: any) {
    console.error("Error handling webhook:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error instanceof Error ? error.message : "Server Error",
      }),
    };
  }
};

const isDatabaseConnection = (data: any) => {
  const connection = data?.connection || "";
  return ["Username-Password-Authentication"].includes(connection);
};

const triggerTrialWorkflow = async (userId: string, email: string) => {
  try {
    const localUser = await UserModel.getAuth0Sub(userId);
    if (localUser) {
      const data = {
        id: localUser._id.toString(),
        email,
      };

      // Replace this with your actual Make webhook URL
      const makeWebhookUrl =
        "https://hook.eu2.make.com/bmelsaimk76v4eunf7sbcs2ioeh82u1f";

      // Forward the data to the Make.com webhook
      await fetch(makeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log(`Workflow JSON payload`, data);
    }
  } catch (error: any) {
    console.warn(`Trigger trial workflow error`, error);
  }
};

export { auth0TrialWebhook as handler };
