/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-escape */
import dayjs from "dayjs";

export function isTrulyEmpty(obj: any) {
  return !obj || Object.keys(obj).length === 0;
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
