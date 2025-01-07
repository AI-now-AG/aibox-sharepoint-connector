import management from "$data/auth0/management-client";

export const getAll = async () => {
  try {
    return await management.roles.getAll();
  } catch (err) {
    console.error("auth0: get all roles error", err);
    throw err;
  }
};

export default {
  getAll,
};
