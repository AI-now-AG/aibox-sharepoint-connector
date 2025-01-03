import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from "@netlify/functions";
import usersManagement from "$data/auth0/users-manager";
import organizationsManagement from "$data/auth0/organizations-manager";

/**
 * Handles Auth0 log stream events
 * Reference: https://auth0.com/docs/customize/log-streams/event-filters#user-behavioral-success
 *
 * @param {Object} event - Incoming event payload from Auth0.
 * @returns {Object} - HTTP response indicating success or failure.
 */
const syncAuth0Resources: Handler = async (
  event: HandlerEvent,
): Promise<HandlerResponse> => {
  try {
    // Ensure the request is from Auth0 (validate secret, IP, or header signature)
    const authHeader = event.headers["authorization"];
    console.log("authHeader", { authHeader });
    if (
      !authHeader ||
      authHeader !== `Bearer 6d3c5bc2-12d1-4d8c-b467-070c81f1adbc`
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
      console.log("log ----> ", log);
      const { type: eventType } = log;

      switch (eventType) {
        case "user.created":
          // Sync user to the local database
          await createUserInDatabase(payload.user);
          break;

        case "user.updated":
          await updateUserInDatabase(payload.user);
          break;

        case "user.deleted":
          await deleteUserFromDatabase(payload.user);
          break;

        default:
          console.log("Unknown event type:", eventType);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Success" }),
    };
  } catch (error) {
    console.error("Error handling webhook:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server Error" }),
    };
  }
};

// Dummy functions for database sync
const createUserInDatabase = async (user: any) => {
  console.log("Creating user:", user);
  // Add your logic to insert the user into the database
};

const updateUserInDatabase = async (user: any) => {
  console.log("Updating user:", user);
  // Add your logic to update the user in the database
};

const deleteUserFromDatabase = async (user: any) => {
  console.log("Deleting user:", user);
  // Add your logic to delete the user from the database
};

export { syncAuth0Resources as handler };
