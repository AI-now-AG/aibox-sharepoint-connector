/**
 * Retrieves an environment variable.
 * Prefers Vite's import.meta.env, falls back to Node's process.env.
 *
 * @param {string} key - The name of the environment variable to retrieve.
 * @returns {string | undefined} - The value of the environment variable.
 */
export const getEnvVar = (key: string) => {
  // if (import.meta.env && import.meta.env[key]) {
  //   return import.meta.env[key];
  // }

  return process.env[key];
};

/**
 * Checks if the current environment is development.
 *
 * @returns {boolean} - True if NODE_ENV is "development".
 */
export const isDev = (): boolean => {
  const env = getEnvVar("NODE_ENV") || "development";
  return env == "development";
};

/**
 * Checks if the current environment is production.
 *
 * @returns {boolean} - True if NODE_ENV is "production".
 */
export const isProd = (): boolean => {
  const env = getEnvVar("NODE_ENV") || "development";
  return env == "production";
};

export default getEnvVar;
