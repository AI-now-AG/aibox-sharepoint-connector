/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from "dayjs";

const replacer = function (this: any, key: any, value: any) {
  if (this[key] instanceof Date) {
    return dayjs(value).format("DD.MM.YYYY");
  }

  return value;
};

export const transformRawData = (data: any) => {
  return JSON.parse(JSON.stringify(data, replacer));
};

export const transformRawDataWithoutReplacer = (data: any) => {
  return JSON.parse(JSON.stringify(data));
};

export default transformRawData;
