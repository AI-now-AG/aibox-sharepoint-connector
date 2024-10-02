import { ManagementClient } from "auth0";

const tenant = import.meta.env.AUTH0_TENANT || "ainow";
export const management = new ManagementClient({
  domain: `${tenant}.eu.auth0.com`,
  clientId: import.meta.env.AUTH0_M2M_CLIENT_ID,
  clientSecret: import.meta.env.AUTH0_M2M_CLIENT_SECRET,
});

export default management;
