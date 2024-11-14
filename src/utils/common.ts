import type { ParsedAuth0UserSub } from "$types/auth0.types";

export const parseAuth0UserSub = (sub: string): ParsedAuth0UserSub => {
  const [provider, id] = sub?.split("|") ?? [];
  return { provider, id };
};
