import type { User } from "lucia";
import { UserRole } from "$data/models/user.model";
import { TenantFeature } from "$data/models/tenant.model";

export const user = (locals: App.Locals): User => {
  return locals.user;
};

export const check = (locals: App.Locals): boolean => {
  return user(locals) ? true : false;
};

export const isSuperAdmin = (locals: App.Locals): boolean => {
  return hasRole(locals, UserRole.SuperAdmin);
};

export const isAdmin = (locals: App.Locals) => {
  return hasRole(locals, UserRole.Admin);
};

export const hasRole = (locals: App.Locals, role: UserRole) => {
  if (!locals.user) {
    return false;
  }

  const { roles } = locals.user;
  return roles.includes(role) ? true : false;
};

export const hasFeature = (locals: App.Locals, feature: TenantFeature) => {
  if (!locals.user) {
    return false;
  }

  const { included_features: features } = locals.tenant;
  return features?.length && features.includes(feature) ? true : false;
};

export default {
  user,
  check,
  isSuperAdmin,
  isAdmin,
  hasRole,
  hasFeature,
};
