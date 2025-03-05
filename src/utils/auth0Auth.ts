import getEnvVar from "$utils/getEnvVar";

export const sendPasswordResetEmail = async (
  email: string,
  connection: string,
) => {
  try {
    const AUTH0_TENANT = getEnvVar("AUTH0_TENANT");
    const CLIENT_ID = getEnvVar("AUTH0_CLIENT_ID");

    // Prepare request body
    const requestBody = {
      client_id: CLIENT_ID,
      email,
      connection,
    };

    // Call Auth0 API to trigger password reset email
    const response = await fetch(
      `https://${AUTH0_TENANT}.eu.auth0.com/dbconnections/change_password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      },
    );

    // Check if the response is OK
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error sending password reset email: ${errorData.error_description || response.statusText}`,
      );
    }

    console.log(`Password reset email sent to ${email}`);
    return await response.text();
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    //throw new Error("Failed to send password reset email.");
  }
};

export const sendVerificationEmail = async (userId: string) => {
  try {
    const AUTH0_TENANT = getEnvVar("AUTH0_TENANT");
    const MNGT_CLIENT_ID = getEnvVar("AUTH0_MNGT_CLIENT_ID");
    const MNGT_CLIENT_SECRET = getEnvVar("AUTH0_MNGT_CLIENT_SECRET");
    const API_AUDIENCE = `https://${AUTH0_TENANT}.eu.auth0.com/api/v2/`;

    // Step 1: Get Auth0 Management API Token
    const tokenResponse = await fetch(
      `https://${AUTH0_TENANT}.eu.auth0.com/oauth/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: MNGT_CLIENT_ID,
          client_secret: MNGT_CLIENT_SECRET,
          audience: API_AUDIENCE,
          grant_type: "client_credentials",
        }),
      },
    );

    if (!tokenResponse.ok) {
      throw new Error(`Error getting Auth0 token: ${tokenResponse.statusText}`);
    }

    const { access_token: accessToken } = await tokenResponse.json();
    console.log(`Response access token`, accessToken);

    // Step 2: Trigger Auth0's Standard Email Verification
    console.log(`Sending verification email via Auth0 for user: ${userId}`);

    const verificationResponse = await fetch(
      `https://${AUTH0_TENANT}.eu.auth0.com/api/v2/jobs/verification-email`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      },
    );

    if (!verificationResponse.ok) {
      const errorText = await verificationResponse.text();
      throw new Error(
        `Error sending verification email: ${verificationResponse.statusText} - ${errorText}`,
      );
    }

    console.log(`Standard verification email sent to user ${userId}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
    //throw new Error("Failed to send verification email.");
  }
};
