import type { ParsedAuth0UserSub } from "$types/auth0.types";
import moment from "moment";

export const parseAuth0UserSub = (sub: string): ParsedAuth0UserSub => {
  const [provider, id] = sub?.split("|") ?? [];
  return { provider, id };
};

export function formatDateToDDMMYY(date: string | Date): string {
  return moment(date).format("DD.MM.YYYY");
}
