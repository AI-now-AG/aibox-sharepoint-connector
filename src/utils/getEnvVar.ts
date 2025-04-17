export const getEnvVar = (key: string) => {
  if (import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }

  return process.env[key];
};

export default getEnvVar;
