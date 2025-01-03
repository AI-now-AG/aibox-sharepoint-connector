import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from "@netlify/functions";
import UserModel, { type User } from "$data/models/user.model";
import TenantModel from "$data/models/tenant.model";
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
      const { data } = log;
      const { type: eventType, description } = data;

      console.log(
        `Event log: ${eventType} / ${description}`,
        JSON.stringify(log),
      );

      // Trigger user create
      // "Create a User" didn't work in this case because the organization could not be detected
      if (
        eventType == "sapi" &&
        description == "Add members to an organization"
      ) {
        await createUserInDatabase(data);
      }

      // Trigger user update
      if (eventType == "sapi" && description == "Update a User") {
        await updateUserInDatabase(data);
      }

      // Trigger user delete
      if (eventType == "sapi" && description == "Delete a User") {
        await deleteUserFromDatabase(data);
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

const createUserInDatabase = async (data: any) => {
  console.log(`Creating user`, data?.details?.request);

  const path = data?.details?.request?.path || ""; // api/v2/organizations/org_jNS9by788jZfem2D/members
  const memberIds = data?.details?.request?.body?.members || []; // ["auth0|6777fe2805771b8ae33c09e3"]
  const orgId = path.match(/organizations\/([^/]+)/)[1];
  const tenant = await TenantModel.getById(orgId);

  for (const memberId of memberIds) {
    const auth0User = await usersManagement.get(memberId);
    const { data: userData } = auth0User;
    if (tenant) {
      const user: Partial<Omit<User, "_id">> = {
        auth0_sub: userData.user_id,
        username: userData.nickname,
        name: userData.name,
        email: userData.email,
        tenant_id: tenant._id,
      };
      await UserModel.add(user);
    }
  }
};

const updateUserInDatabase = async (data: any) => {
  console.log(`Updating user`, data?.details?.response);

  const auth0User = data?.details?.response?.body || {};

  if (Object.keys(auth0User).length > 0) {
    await UserModel.upsertByAuth0Sub(auth0User.user_id, {
      username: auth0User.nickname,
      name: auth0User.name,
      email: auth0User.email,
      picture: auth0User.picture,
      //roles: _roles,
      //permissions: assignPermissions(_roles),
      last_login: auth0User.last_login?.toString(),
      logins_count: auth0User.logins_count,
      email_verified: auth0User.email_verified,
      blocked: auth0User.blocked,
    });
  }
};

const deleteUserFromDatabase = async (data: any) => {
  console.log(`Deleting user`, data?.details?.response);

  const auth0User = data?.details?.response?.body || {};
  const localUser = await UserModel.getAuth0Sub(auth0User.user_id);

  if (localUser) {
    await UserModel.delete(localUser._id.toString());
  }
};

export { syncAuth0Resources as handler };
