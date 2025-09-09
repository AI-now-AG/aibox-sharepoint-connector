/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from "dayjs";

const replacer = function (this: any, key: any, value: any) {
  if (this[key] instanceof Date) {
    return dayjs(value).format("DD.MM.YYYY");
  }

  return value;
};

/**
 * Convert raw data to plain JSON.
 * @param data - The value to serialize/clone.
 * @param useReplacer - Apply the custom `replacer` (default: true).
 * @returns The JSON-cloned value.
 */
export function transformRawData(data: any, useReplacer = true) {
  return JSON.parse(JSON.stringify(data, useReplacer ? replacer : undefined));
}

export default transformRawData;
