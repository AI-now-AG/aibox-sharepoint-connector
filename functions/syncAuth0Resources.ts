import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from "@netlify/functions";
import UserModel, {
  assignPermissions,
  UserRole,
  type User,
} from "$data/models/user.model";
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

      // Trigger successful login
      // See: https://auth0.com/docs/customize/log-streams/event-filters#login-success
      if (eventType == "s") {
        await syncAuth0UserOnLogin(data);
      }

      // Trigger 'Add members to an organization'
      // "Create a User" didn't work in this case because the organization could not be detected
      // See: https://auth0.com/docs/customize/log-streams/event-filters#management-api-success
      if (
        eventType == "sapi" &&
        description == "Add members to an organization"
      ) {
        await createUserInDatabase(data);
      }

      // Trigger 'Update a User'
      // See: https://auth0.com/docs/customize/log-streams/event-filters#management-api-success
      if (eventType == "sapi" && description == "Update a User") {
        await updateUserInDatabase(data);
      }

      // Trigger 'Delete a User'
      // See: https://auth0.com/docs/customize/log-streams/event-filters#management-api-success
      if (eventType == "sapi" && description == "Delete a User") {
        await deleteUserFromDatabase(data);
      }

      // Trigger 'Assign user roles to an Organization member'
      // "Create a User" didn't work in this case because the organization could not be detected
      // See: https://auth0.com/docs/customize/log-streams/event-filters#management-api-success
      if (
        eventType == "sapi" &&
        (description == "Assign user roles to an Organization member" ||
          description == "Delete user roles from an Organization member")
      ) {
        await updateUserRolesInDatabase(data);
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

const isPermittedChannel = (data: any) => {
  const requestChannel = data?.details?.request?.channel || "";
  const permittedChannels = ["https://manage.auth0.com/"];
  return permittedChannels.includes(requestChannel);
};

const createUserInDatabase = async (data: any) => {
  console.log(`Creating user`, data?.details?.request);

  // Skip if the channel is not permitted.
  if (!isPermittedChannel(data)) {
    console.warn(`Creating user / channel is not permitted.`);
    return;
  }

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
      const localUser = await UserModel.getAuth0Sub(auth0User.data.user_id);
      if (!localUser) {
        await UserModel.add(user);
      }
    }
  }
};

const updateUserInDatabase = async (data: any) => {
  console.log(`Updating user`, data?.details?.response);

  // Skip if the channel is not permitted.
  if (!isPermittedChannel(data)) {
    console.warn(`Updating user / channel is not permitted.`);
    return;
  }

  const auth0User = data?.details?.response?.body || {};
  const localUser = await UserModel.getAuth0Sub(auth0User.user_id);

  if (localUser) {
    const update: Partial<User> = {
      username: auth0User.nickname,
      name: auth0User.name,
      email: auth0User.email,
      picture: auth0User.picture,
      last_login: auth0User.last_login?.toString(),
      logins_count: auth0User.logins_count,
      email_verified: auth0User.email_verified,
      blocked: auth0User.blocked,
    };
    await UserModel.update(localUser._id, update);
  }
};

const deleteUserFromDatabase = async (data: any) => {
  console.log(`Deleting user`, data?.details?.response);

  // Skip if the channel is not permitted.
  if (!isPermittedChannel(data)) {
    console.warn(`Deleting user / channel is not permitted.`);
    return;
  }

  // Take the "userId" from request
  // Example path: api/v2/users/auth0%7C67766a5f7369b90287906204
  const path = data?.details?.request?.path || "";
  const userId = decodeURIComponent(path.split("/").pop());
  const localUser = await UserModel.getAuth0Sub(userId);

  if (localUser) {
    await UserModel.delete(localUser._id.toString());
  }
};

const updateUserRolesInDatabase = async (data: any) => {
  console.log(`Updating user roles`, data?.details?.response);

  // Skip if the channel is not permitted.
  if (!isPermittedChannel(data)) {
    console.warn(`Updating user roles / channel is not permitted.`);
    return;
  }

  // Take the "userId" from request path and "roles" from request body
  // Example path: api/v2/organizations/org_FpOtXZcZwVZc1unJ/members/auth0%7C66f3a9897dbebab8f2ae9cc0/roles
  const path = data?.details?.request?.path || "";

  // Match the organization ID between "/organizations/" and "/members/"
  const match = path.match(/\/organizations\/([^/]+)\//);
  const orgId = match ? match[1] : "";

  // Extract and decode the user ID from the URL path after "/members/"
  const userId = decodeURIComponent(path.split("/members/")[1].split("/")[0]);

  const memberRoles = await organizationsManagement.getMemberRoles(
    orgId,
    userId,
  );
  const roleNames = memberRoles.data.map((role) => role.name as UserRole);
  const localUser = await UserModel.getAuth0Sub(userId);

  if (localUser) {
    const update: Partial<User> = {
      roles: roleNames,
      permissions: assignPermissions(roleNames),
    };
    await UserModel.update(localUser._id, update);
  }
};

const syncAuth0UserOnLogin = async (data: any) => {
  const { user_id: userId, organization_id: orgId } = data;
  console.log(`Sync auth0 user on login`, { userId, orgId });

  const memberRoles = await organizationsManagement.getMemberRoles(
    orgId,
    userId,
  );
  const roleNames = memberRoles.data.map((role) => role.name as UserRole);
  const isAdmin = roleNames?.some((role) =>
    [UserRole.SuperAdmin, UserRole.Admin].includes(role),
  );

  // If the user is an Admin, sync all organization members' data
  if (isAdmin) {
    await syncAllOrganizationUsers(orgId, userId);
  }

  // Sync last login and login count
  const loginsCount = data.details?.stats?.loginsCount ?? 0;
  const update: Partial<User> = {
    last_login: new Date().toISOString(),
    logins_count: loginsCount,
  };
  await UserModel.upsertByAuth0Sub(userId, update);
};

const syncAllOrganizationUsers = async (
  orgId: string,
  loggedInUserId?: string,
) => {
  const response = await usersManagement.getAllUsers({
    q: `organization_id: ${orgId}`,
  });
  const users = response.data ?? [];
  const tenant = await TenantModel.getById(orgId);

  if (!tenant) {
    console.error("No tenant is associated with this user..");
    return;
  }

  for (const user of users) {
    if (loggedInUserId && loggedInUserId == user.user_id) {
      console.warn(
        `Sync all organization users - user ${loggedInUserId} is excluded`,
      );
      continue; // Skip this iteration
    }

    const auth0UserRoles = await organizationsManagement.getMemberRoles(
      orgId,
      user.user_id,
    );
    const roleNames = auth0UserRoles.data.map((role) => role.name as UserRole);
    const userRoles = roleNames.length ? roleNames : [UserRole.User];

    console.log(
      `Sync all organization users - user ${user.user_id} has been synced`,
    );

    // Upserts a user by their Auth0 subscription ID (sub).
    await UserModel.upsertByAuth0Sub(user.user_id, {
      tenant_id: tenant._id,
      auth0_sub: user.user_id,
      username: user.nickname,
      name: user.name,
      email: user.email,
      picture: user.picture,
      roles: userRoles,
      permissions: assignPermissions(userRoles),
      last_login: user.last_login?.toString(),
      logins_count: user.logins_count || 0,
      email_verified: user.email_verified,
      blocked: user.blocked,
    });
  }
};

export { syncAuth0Resources as handler };
