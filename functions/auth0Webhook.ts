/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from "@netlify/functions";
import UserModel, {
  assignPermissions,
  type User,
} from "$data/models/user.model";
import TenantModel, { type Tenant } from "$data/models/tenant.model";
import usersManagement from "$data/auth0/users-manager";
import organizationsManagement from "$data/auth0/organizations-manager";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendNotificationEmail,
} from "$utils/auth0Auth";
import type { UserRole } from "$enums/Users";

/**
 * Handles Auth0 log stream events
 * Reference: https://auth0.com/docs/customize/log-streams/event-filters#user-behavioral-success
 *
 * @param {Object} event - Incoming event payload from Auth0.
 * @returns {Object} - HTTP response indicating success or failure.
 */
const auth0Webhook: Handler = async (
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
        `Event log: ${eventType} / ${description}`,
        JSON.stringify(log),
      );

      // Trigger successful login
      // See: https://auth0.com/docs/customize/log-streams/event-filters#login-success
      if (eventType == "s") {
        await syncAuth0UserOnLogin(data);
      }

      // Trigger successful signup
      // See: https://auth0.com/docs/customize/log-streams/event-filters#signup-success
      if (eventType == "ss") {
        if (isPermittedConnection(data)) {
          await triggerRegistrationEmail(data);
          await updateUserMetadata(data.user_id, { signup: true });
        }

        // Send welcome email for social login
        if (["windowslive", "google-oauth2"].includes(data.connection)) {
          const { user_name: email, user_id: userId, connection } = data;
          await triggerWelcomeEmail(userId, email, connection);
        }
      }

      // Trigger successful called verification email endpoint
      // See: https://auth0.com/docs/customize/log-streams/event-filters#user-behavioral-success
      if (eventType == "sv") {
        const { email, user_id: userId } = data.details.query;
        await triggerWelcomeEmail(userId, email, data.connection);
      }

      // Trigger 'Add members to an organization'
      // "Create a User" didn't work in this case because the organization could not be detected
      // See: https://auth0.com/docs/customize/log-streams/event-filters#management-api-success
      if (
        eventType == "sapi" &&
        description == "Add members to an organization"
      ) {
        if (isPermittedChannel(data)) {
          await createUserInDatabase(data);
        }
      }

      // Trigger 'Update a User'
      // See: https://auth0.com/docs/customize/log-streams/event-filters#management-api-success
      if (eventType == "sapi" && description == "Update a User") {
        if (isPermittedChannel(data)) {
          await updateUserInDatabase(data);
        }
      }

      // Trigger 'Delete a User' or 'Delete members from an organization'
      // See: https://auth0.com/docs/customize/log-streams/event-filters#management-api-success
      if (
        eventType == "sapi" &&
        (description == "Delete a User" ||
          description == "Delete members from an organization")
      ) {
        if (isPermittedChannel(data)) {
          await deleteUserFromDatabase(data);
        }
      }

      // Trigger 'Assign user roles to an Organization member' or 'Delete user roles from an Organization member'
      // "Create a User" didn't work in this case because the organization could not be detected
      // See: https://auth0.com/docs/customize/log-streams/event-filters#management-api-success
      if (
        eventType == "sapi" &&
        (description == "Assign user roles to an Organization member" ||
          description == "Delete user roles from an Organization member")
      ) {
        if (isPermittedChannel(data)) {
          await updateUserRolesInDatabase(data);
        }
      }

      // Trigger 'Create an Organization'
      // See: https://auth0.com/docs/customize/log-streams/event-filters#management-api-success
      if (eventType == "sapi" && description == "Create an Organization") {
        if (isPermittedChannel(data)) {
          await createTenantInDatabase(data);
        }
      }

      // Trigger 'Modify an Organization'
      // See: https://auth0.com/docs/customize/log-streams/event-filters#management-api-success
      if (eventType == "sapi" && description == "Modify an Organization") {
        if (isPermittedChannel(data)) {
          await updateTenantInDatabase(data);
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

const isPermittedChannel = (data: any) => {
  const requestChannel = data?.details?.request?.channel || "";
  const permittedChannels = ["https://manage.auth0.com/"];
  return permittedChannels.includes(requestChannel);
};

const isPermittedConnection = (data: any) => {
  const connection = data?.connection || "";
  const permittedCons = ["Username-Password-Authentication"];
  return permittedCons.includes(connection);
};

const triggerRegistrationEmail = async (data: any) => {
  console.log(`Trigger registration email`, data.details);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user_id: userId } = data;
  const { email, connection, is_signup: isSignup } = data.details.body;
  if (isSignup == true) {
    // Send user verification email
    await sendVerificationEmail(userId, email);

    // Send admin notification email
    const emailSubject = "aibox - New User Signup Alert";
    const emailContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1><b>New User Signup Notification</b></h1>
        <p><b>User ID:</b> ${userId}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Signup Date:</b> ${new Date().toLocaleDateString()}</p>
      </div>
    `;
    await sendNotificationEmail(emailSubject, emailContent);
  } else {
    await sendPasswordResetEmail(email, connection);
  }
};

const triggerWelcomeEmail = async (
  userId: string,
  email: string,
  connection: string,
) => {
  console.log(`Trigger welcome email`, { userId, email, connection });
  // Send user welcome email
  await sendWelcomeEmail(email);

  // Send admin notification email
  if (connection == "Username-Password-Authentication") {
    const emailSubject = "aibox - New User Verified Alert";
    const emailContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1><b>New User Verified Notification</b></h1>
        <p><b>User ID:</b> ${userId}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Verified Date:</b> ${new Date().toLocaleDateString()}</p>
      </div>
    `;
    await sendNotificationEmail(emailSubject, emailContent);
  }
};

const createUserInDatabase = async (data: any) => {
  console.log(`Creating user`, data?.details?.request);

  const path = data?.details?.request?.path || ""; // api/v2/organizations/org_jNS9by788jZfem2D/members
  const memberIds = data?.details?.request?.body?.members || []; // ["auth0|6777fe2805771b8ae33c09e3"]
  const orgId = path.match(/organizations\/([^/]+)/)[1];
  const tenant = await TenantModel.getById(orgId);

  try {
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
  } catch (error: any) {
    console.warn(`Creating user error`, error);
  }
};

const updateUserInDatabase = async (data: any) => {
  console.log(`Updating user`, data?.details?.response);

  const auth0User = data?.details?.response?.body || {};
  const localUser = await UserModel.getAuth0Sub(auth0User.user_id);

  try {
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
  } catch (error: any) {
    console.warn(`Updating user error`, error);
  }
};

const deleteUserFromDatabase = async (data: any) => {
  console.log(`Deleting user`, data?.details?.response);

  const { description } = data;

  // Handle the 'Delete a User' event
  if (description == "Delete a User") {
    // Take the "userId" from request
    // Example path: api/v2/users/auth0%7C67766a5f7369b90287906204
    const path = data?.details?.request?.path || "";
    const userId = decodeURIComponent(path.split("/").pop());
    const localUser = await UserModel.getAuth0Sub(userId);
    if (localUser) {
      await UserModel.delete(localUser._id.toString());
    }
  }

  // Handle the 'Delete members from an organization' event
  if (description == "Delete members from an organization") {
    // Take the "members[]" from request body
    const requestBody = data?.details?.request?.body;
    const members = requestBody?.members ?? [];
    for (const id of members) {
      const user = await UserModel.getAuth0Sub(id);
      if (user) {
        await UserModel.delete(user._id.toString());
      }
    }
  }
};

const updateUserRolesInDatabase = async (data: any) => {
  console.log(`Updating user roles`, data?.details?.response);

  // Take the "userId" from request path and "roles" from request body
  // Example path: api/v2/organizations/org_FpOtXZcZwVZc1unJ/members/auth0%7C66f3a9897dbebab8f2ae9cc0/roles
  const path = data?.details?.request?.path || "";

  // Match the organization ID between "/organizations/" and "/members/"
  const match = path.match(/\/organizations\/([^/]+)\//);
  const orgId = match ? match[1] : "";

  // Extract and decode the user ID from the URL path after "/members/"
  const userId = decodeURIComponent(path.split("/members/")[1].split("/")[0]);

  try {
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
  } catch (error: any) {
    console.warn(`Updating user roles error`, error);
  }
};

const updateUserMetadata = async (userId: string, update: any) => {
  console.log(`Update user metadata`, { userId, update });

  try {
    await usersManagement.update(userId, {
      user_metadata: update,
    });
  } catch (error: any) {
    console.warn(`Updating user metadata error`, error);
  }
};

const createTenantInDatabase = async (data: any) => {
  console.log(`Creating tenant`, data?.details?.response);

  // Take the "orgId" from response body
  // Example: { id: "org_kxLHFC47tCHHOxsB" }
  const orgId = data?.details?.response?.body?.id || "";

  try {
    const auth0Tenant = await organizationsManagement.get(orgId);

    const tenant: Partial<Omit<Tenant, "_id">> = {
      org_id: auth0Tenant.data.id,
      org_name: auth0Tenant.data.name,
      name: auth0Tenant.data.display_name,
    };
    await TenantModel.create(tenant);
  } catch (error: any) {
    console.warn(`Creating tenant error`, error);
  }
};

const updateTenantInDatabase = async (data: any) => {
  console.log(`Updating tenant`, data?.details?.response);

  // Take the "orgId" from response body
  // Example: { id: "org_kxLHFC47tCHHOxsB" }
  const orgId = data?.details?.response?.body?.id || "";

  try {
    const localTenant = await TenantModel.getById(orgId);
    const auth0Tenant = await organizationsManagement.get(orgId);

    if (localTenant) {
      const update: Partial<Tenant> = {
        org_name: auth0Tenant.data.name,
        name: auth0Tenant.data.display_name,
      };
      await TenantModel.update(localTenant._id, update);
    }
  } catch (error: any) {
    console.warn(`Updating tenant error`, error);
  }
};

const syncAuth0UserOnLogin = async (data: any) => {
  const { user_id: userId, organization_id: orgId } = data;
  console.log(`Sync auth0 user on login`, { userId, orgId });

  // Sync last login and login count
  try {
    const loginsCount = data.details?.stats?.loginsCount ?? 0;
    const update: Partial<User> = {
      last_login: new Date().toISOString(),
      logins_count: loginsCount,
    };
    await UserModel.upsertByAuth0Sub(userId, update);
  } catch (error: any) {
    console.warn(`Sync auth0 user on login error`, error);
  }
};

export { auth0Webhook as handler };
