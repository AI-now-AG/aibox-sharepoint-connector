import UserModel, { assignPermissions } from "$data/models/user.model";
import TenantModel from "$data/models/tenant.model";
import usersManagement from "$data/auth0/users-manager";
import organizationsManagement from "$data/auth0/organizations-manager";
import { UserRole } from "$types/Users";

export const syncAllOrganizationUsers = async (
  orgId: string,
  loggedInUserId?: string,
) => {
  const response = await usersManagement.getAllUsers({
    q: `organization_id: ${orgId}`,
  });
  const users = response.data ?? [];
  const tenant = await TenantModel.getById(orgId);

  if (!tenant) {
    console.error("No tenant is associated with this user.");
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
    console.log(
      `Sync all organization users - user ${user.user_id} has been synced`,
    );
  }
};
