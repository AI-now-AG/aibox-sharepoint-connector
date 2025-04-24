/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-escape */
import type { ParsedAuth0UserSub } from "$types/auth0.types";
import moment from "moment";

export const parseAuth0UserSub = (auth0Sub: string): ParsedAuth0UserSub => {
  const [provider, id] = auth0Sub?.split("|") ?? [];
  return { provider, id };
};

export const isEnterpriseConnection = (auth0Sub: string): boolean => {
  const [provider] = auth0Sub?.split("|") ?? [];
  const enterpriseConnections = [
    "saml",
    "oidc",
    "okta",
    "google",
    "waad",
    "adfs",
    "ad",
    "ping",
  ];
  return enterpriseConnections.includes(provider);
};

export const isSocialConnection = (auth0Sub: string): boolean => {
  const [provider] = auth0Sub?.split("|") ?? [];
  const socialConnections = ["google-oauth2", "windowslive"];
  return socialConnections.includes(provider);
};

export function isTrulyEmpty(obj: any) {
  return !obj || Object.keys(obj).length === 0;
}

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

export function tryParse(input: string): object | string {
  let result;
  try {
    result = JSON.parse(input);
  } catch {
    result = input;
  }
  return result;
}

export function randomString(length: number = 5) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function parseChunkCitations(inputString: string): object | string {
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

export function formatCitations(
  inputString: string,
  citations: Array<string>,
): string {
  const updatedString = inputString.replace(/\[(\d+)\]/g, (match, p1) => {
    const index = parseInt(p1, 10) - 1;
    if (index >= 0 && index < citations.length) {
      return `<a href='${citations[index]}' target='_blank' class='bg-base-200 hover:bg-info text-info hover:text-base-200 text-xs font-normal ml-1 rounded-sm justify-center items-center'>[${p1}]</a>`;
    }
    return match;
  });
  return updatedString;
}

export function formatMarkdown(text: string) {
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>");
  text = text.replace(/__(.*?)__/g, "<u>$1</u>");
  text = text.replace(/~~(.*?)~~/g, "<del>$1</del>");
  text = text.replace(/`(.*?)`/g, "<code>$1</code>");
  text = text.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  text = text.replace(/^###### (.*)$/gm, "<h6 class='text-xs'>$1</h6>");
  text = text.replace(/^##### (.*)$/gm, "<h5 class='text-sm'>$1</h5>");
  text = text.replace(/^#### (.*)$/gm, "<h4 class='text-base'>$1</h4>");
  text = text.replace(/^### (.*)$/gm, "<h3 class='text-lg'>$1</h3>");
  text = text.replace(/^## (.*)$/gm, "<h2 class='text-xl'>$1</h2>");
  text = text.replace(/^# (.*)$/gm, "<h1 class='text-2xl'>$1</h1>");
  text = text.replace(/\n/g, "<br>");
  return text;
}

export function stripHtmlFormatting(text: string): string {
  text = text.replace(/<\/?(strong|em|u|del|code|pre|h[1-6][^>]*)>/gi, "");
  text = text.replace(/<br>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  return text.trim();
}
