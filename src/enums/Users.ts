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

export const EncryptedUserPassword =
  "dea510d6a7e4e4c0e5f81ce9a8c9eb4c:43bb938b99ae20bceb3641bccb9c663a7d602db3a189a11e8e3228eb63ce1bc3";
