export const getEnvVar = (key: string) => {
  return import.meta?.env?.[key] || process.env[key];
};

export default getEnvVar;
