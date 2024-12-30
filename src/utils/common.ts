import type { ParsedAuth0UserSub } from "$types/auth0.types";

export const parseAuth0UserSub = (sub: string): ParsedAuth0UserSub => {
  const [provider, id] = sub?.split("|") ?? [];
  return { provider, id };
};

export function formatDateToDDMMYY(dateString: string): string {
  const date = new Date(dateString);

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-based
  const year = date.getUTCFullYear();
  return `${day}.${month}.${year}`;
}
