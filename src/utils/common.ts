/* eslint-disable no-useless-escape */
import type { ParsedAuth0UserSub } from "$types/auth0.types";
import moment from "moment";

export const parseAuth0UserSub = (auth0Sub: string): ParsedAuth0UserSub => {
  const [provider, id] = auth0Sub?.split("|") ?? [];
  return { provider, id };
};

export const isEnterpriseConnection = (auth0Sub: string): boolean => {
  const [provider] = auth0Sub?.split("|") ?? [];
  const enterpriseProviders = [
    "saml",
    "oidc",
    "okta",
    "google",
    "waad",
    "adfs",
    "ad",
    "ping",
  ];
  return enterpriseProviders.includes(provider);
};

export function formatDateToDDMMYY(date: string | Date): string {
  return moment(date).format("DD.MM.YYYY");
}

export const isValidEmail = (email: string) => {
  const emailRegex = /^[\w.+-]+@[\w.-]+\.\w{2,3}$/;
  return emailRegex.test(email);
};

export const isValidMongoDbObjectId = (id: string) =>
  /^[0-9a-fA-F]{24}$/.test(id);
