export const transformDataToArray = (data: any) => {
  return JSON.parse(JSON.stringify(data));
};

export default transformDataToArray;
