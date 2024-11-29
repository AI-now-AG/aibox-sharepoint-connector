import { TenantFeature } from "$data/models/tenant.model";
import { UserRole } from "$data/models/user.model";
import type { User } from "lucia";

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

export const hasAudioPlaintext = (locals: App.Locals) => {
  if (!locals.tenant) {
    return false;
  }

  const { transcriptions } = locals.tenant;
  let result = false;
  if (transcriptions?.plaintext?.enabled ?? false) {
    result = true;
  }
  return result;
};

export const hasAudioSubtitles = (locals: App.Locals) => {
  if (!locals.tenant) {
    return false;
  }

  const { transcriptions } = locals.tenant;
  let result = false;
  if (transcriptions?.subtitles?.enabled ?? false) {
    result = true;
  }
  return result;
};

export const hasAudioSummary = (locals: App.Locals) => {
  if (!locals.tenant) {
    return false;
  }

  const { transcriptions } = locals.tenant;
  let result = false;
  if (transcriptions?.summary?.enabled ?? false) {
    result = true;
  }
  return result;
};

export default {
  user,
  check,
  isSuperAdmin,
  isAdmin,
  hasRole,
  hasFeature,
  hasAudioPlaintext,
  hasAudioSubtitles,
  hasAudioSummary,
};
