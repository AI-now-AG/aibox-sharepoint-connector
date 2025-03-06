import { managementClient } from "$data/auth0/client";

export const getAll = async () => {
  try {
    return await managementClient.roles.getAll();
  } catch (err) {
    console.error("auth0: get all roles error", err);
    throw err;
  }
};

export default {
  getAll,
};
