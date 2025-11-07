/* eslint-disable @typescript-eslint/no-explicit-any */
import { AudioOptionId, AudioOptionLabels } from "$types/Subscription";
import dayjs from "dayjs";

export function isTrulyEmpty(obj: any) {
  return !obj || Object.keys(obj).length === 0;
}

export function toHeadline(str = "") {
  return str
    .replace(/[_\-.]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function capitalizeFirst(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDateToDDMMYY(date: string | Date): string {
  return dayjs(date).format("DD.MM.YYYY");
}

export const isValidEmail = (email: string) => {
  const emailRegex = /^[\w.+-]+@[\w.-]+\.\w{2,3}$/;
  return emailRegex.test(email);
};

export const preventDefault = (fn: any) => {
  return function (this: any, event: any) {
    event.preventDefault();
    fn?.call(this, event);
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

export function isSameObjectId(a: unknown, b: unknown): boolean {
  const strA = typeof a === "string" ? a : a?.toString();
  const strB = typeof b === "string" ? b : b?.toString();

  if (!strA || !strB) return false;
  return strA === strB;
}


export const getSubscriptionAddOnName = (
  forOption: "audiototext" | "subtitle" = "audiototext",
  planAddOns: Array<any> = [],
) => {
  const addOnOptions: Array<any> =
    forOption == "audiototext"
      ? planAddOns.filter((option: any) => {
        return (
          option == AudioOptionId.AudioBasis ||
          option == AudioOptionId.AudioBasisAddOnLarge
        );
      }) || []
      : planAddOns.filter((option: any) => {
        return (
          option == AudioOptionId.AudioBasisAddOnSubtitle ||
          option == AudioOptionId.AudioPremium
        );
      }) || [];
  const firstOption = addOnOptions?.[0] as AudioOptionId | undefined;
  return firstOption ? AudioOptionLabels[firstOption] || "-" : "-";
};