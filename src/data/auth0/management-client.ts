import { ManagementClient } from "auth0";

const tenant = import.meta.env.AUTH0_TENANT || "ainow";
const clientId = import.meta.env.AUTH0_MNGT_CLIENT_ID;
const clientSecret = import.meta.env.AUTH0_MNGT_CLIENT_SECRET;

export const management = new ManagementClient({
  domain: `${tenant}.eu.auth0.com`,
  clientId,
  clientSecret,
});

export default management;
