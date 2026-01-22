import { useTranslations } from "$i18n/utils";
import { UserRole } from "$types/Users";

const t = useTranslations();

const ROLE_PRIORITY = [
  [UserRole.SuperAdmin, "user.super-admin"],
  [UserRole.Admin, "user.admin"],
  [UserRole.SuperUser, "user.super-user"],
  [UserRole.User, "user.user"],
] as const;

export function getRoleString(roles: UserRole[] = []) {
  for (const [role, key] of ROLE_PRIORITY) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (roles.includes(role)) return t(key as any);
  }
  return t("user.user");
}
