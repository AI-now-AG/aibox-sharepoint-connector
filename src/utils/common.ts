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

export const preventDefault = (fn: any) => {
  return function (this: any, event: any) {
    event.preventDefault();
    fn.call(this, event);
  };
};

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function tryParse(input: string): Object | string {
  let result;
  try {
    result = JSON.parse(input);
  } catch (error) {
    result = input;
  } finally {
    return result;
  }
}

export function parseChunkCitations(inputString: string): Object | string {
  const unescapedString = inputString.replace(/\\\"/g, '"');
  const jsonMatch = unescapedString.match(/{.*?}/s);
  if (jsonMatch) {
    const jsonString = jsonMatch[0];
    try {
      const jsonObject = JSON.parse(jsonString);
      const citations = jsonObject.citations;
      const remainingText = unescapedString.slice(jsonString.length);
      const result = {
        citations,
        content: remainingText.trim(),
      };
      return result;
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  }
  return inputString;
}

export function replaceCitations(
  inputString: string,
  citations: Array<string>,
): string {
  const updatedString = inputString.replace(/\[(\d+)\]/g, (match, p1) => {
    const index = parseInt(p1, 10) - 1;
    if (index >= 0 && index < citations.length) {
      return `<a href='${citations[index]}' target='_blank' class='bg-gray-100 hover:bg-blue-600 text-blue-600 hover:text-white text-xs font-normal ml-1 rounded justify-center items-center'>[${p1}]</a>`;
    }
    return match;
  });
  return updatedString;
}
