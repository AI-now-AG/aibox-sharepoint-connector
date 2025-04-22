export const getEnvVar = (key: string) => {
  if (import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }

  return process.env[key];
};

export const isDev = (): boolean => {
  const env = getEnvVar("NODE_ENV") || "development";
  return env == "development";
};

export const isProd = (): boolean => {
  const env = getEnvVar("NODE_ENV") || "development";
  return env == "production";
};

export default getEnvVar;
