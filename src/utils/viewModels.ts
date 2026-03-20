import type { User } from "lucia";
import { omitWithWildcard } from "$utils/wildcardMatch";
import { type Tenant } from "$data/models/tenant.model";

export function pickUser(user: User) {
  return {
    _id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    api_token: user.api_token,
    picture: user.picture,
  };
}

export function pickTenant(tenant: Tenant) {
  const excludedFields = [
    "*_api_key",
    "billing_info",
    "billing_method",
    "metadata",
  ];
  return omitWithWildcard(tenant, excludedFields);
}
