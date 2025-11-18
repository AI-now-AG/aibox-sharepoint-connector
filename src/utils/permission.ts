import { FEATURE_PERMISSIONS_MAP, type FeaturePermission, type Permission } from "$types/Users";

export function isFeaturePermissionEnabled(
    feature: FeaturePermission,
    userPermissions: Permission[]
): boolean {
    const requiredPermissions = FEATURE_PERMISSIONS_MAP[feature];
    return requiredPermissions.some((permission) => userPermissions.includes(permission));
}   