import { AuthenticationClient, ManagementClient } from "auth0";
import getEnvVar from "$utils/getEnvVar";

const tenant = getEnvVar("AUTH0_TENANT");
const clientId = getEnvVar("AUTH0_MNGT_CLIENT_ID");
const clientSecret = getEnvVar("AUTH0_MNGT_CLIENT_SECRET");

export const managementClient = new ManagementClient({
  domain: `${tenant}.eu.auth0.com`,
  clientId,
  clientSecret,
});

export const authenticationClient = new AuthenticationClient({
  domain: `${tenant}.eu.auth0.com`,
  clientId,
  clientSecret,
});
