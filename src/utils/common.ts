/* eslint-disable @typescript-eslint/no-explicit-any */
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

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function formatDate(
  date: string | Date | number | null | undefined,
  format = "DD.MM.YYYY",
): string {
  if (!date) return "";

  if (!date) return "";

  const d = dayjs(date);

  if (!d.isValid()) {
    console.warn("Invalid date:", date);
    return "";
  }

  return d.format(format);
}

export const preventDefault = (fn: any) => {
  return function (this: any, event: any) {
    event.preventDefault();
    fn?.call?.(this, event);
  };
};

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay = 300,
) {
  let t: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
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

export function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim();

  // E.164 format: + followed by 8–15 digits (e.g., +84901234567)
  const regex = /^\+?[1-9]\d{7,14}$/;

  return regex.test(trimmed);
}

export function bgOpacity(color: string, opacity = 0.4) {
  return `${color}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0")}`;
}
