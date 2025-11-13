import type { User } from "lucia";
import { UserRole } from "$types/Users";
import { ApiKeyProvider, TenantFeature } from "$types/TenantFeature";

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

export const isSuperUser = (locals: App.Locals) => {
  return hasRole(locals, UserRole.SuperUser);
};

export const hasRole = (locals: App.Locals, role: UserRole) => {
  if (!locals.user) {
    return false;
  }

  const { roles } = locals.user;
  return roles.includes(role) ? true : false;
};

export const hasFeature = (locals: App.Locals, feature: TenantFeature) => {
  if (!locals.tenant) {
    return false;
  }

  const { included_features: features } = locals.tenant;
  let result = false;

  if (features && features?.length) {
    result = features.some((item) => item.name == feature);
  }

  return result;
};

export const hasFeatureWithProvider = (
  locals: App.Locals,
  feature: TenantFeature,
  provider: ApiKeyProvider,
) => {
  if (!locals.tenant) {
    return false;
  }

  return locals.tenant.included_features?.some((item) => {
    return item.name == feature && item.provider == provider;
  });
};

export default {
  user,
  check,
  isSuperAdmin,
  isAdmin,
  isSuperUser,
  hasRole,
  hasFeature,
  hasFeatureWithProvider,
};
