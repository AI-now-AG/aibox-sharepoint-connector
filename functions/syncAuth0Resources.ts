import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from "@netlify/functions";
import UserModel from "$data/models/user.model";
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

    const createEvents = ["sapi"];
    const updateEvents = ["sapi"];

    // Handle each event type
    for (const log of logs) {
      const { type: eventType, description } = log;

      console.log(`Event log: ${eventType} / ${description}`);
      console.dir(log, { depth: null, colors: true });

      const createEvents = ["sapi"];

      // Event-type: "sapi" Successful Management API operation

      // Trigger user create
      if (eventType == "sapi" && description == "Create a User") {
        await createUserInDatabase(log.user_id);
      }

      // Trigger user update
      if (eventType == "sapi" && description == "Update a User") {
        await updateUserInDatabase(log.user_id);
      }

      // Trigger user delete
      if (eventType == "sapi" && description == "Delete a User") {
        await deleteUserFromDatabase(log.user_id);
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
const createUserInDatabase = async (userId: string) => {
  console.log(`Creating user: ${userId}`);
};

const updateUserInDatabase = async (userId: string) => {
  console.log(`Updating user: ${userId}`);
  const auth0User = await usersManagement.get(userId);
  const { data: userData } = auth0User;

  await UserModel.upsertByAuth0Sub(userId, {
    username: userData.nickname,
    name: userData.name,
    email: userData.email,
    picture: userData.picture,
    //roles: _roles,
    //permissions: assignPermissions(_roles),
    last_login: userData.last_login?.toString(),
    logins_count: userData.logins_count,
    email_verified: userData.email_verified,
    blocked: userData.blocked,
  });
};

const deleteUserFromDatabase = async (userId: string) => {
  console.log(`Deleting user: ${userId}`);
  const localUser = await UserModel.getAuth0Sub(userId);
  if (localUser) {
    await UserModel.delete(localUser._id.toString());
  }
};

export { syncAuth0Resources as handler };
