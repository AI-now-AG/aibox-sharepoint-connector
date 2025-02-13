export enum UserRole {
  Admin = "Admin",
  SuperAdmin = "Super Admin",
  User = "User",
}

export enum Permission {
  UserAll = "user:all",
  AdminAll = "admin:all",
  SuperAll = "super:all",
}

export const ROLE_PERMISSIONS_MAP = {
  [UserRole.User]: [Permission.UserAll],
  [UserRole.Admin]: [Permission.UserAll, Permission.AdminAll],
  [UserRole.SuperAdmin]: [
    Permission.UserAll,
    Permission.AdminAll,
    Permission.SuperAll,
  ],
};
