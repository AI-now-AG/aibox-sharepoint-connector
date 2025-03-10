import sgMail, { type MailDataRequired } from "@sendgrid/mail";
import { authenticationClient, managementClient } from "$data/auth0/client";
import { SG_VERIFICATION_TEMPLATE, SG_WELCOME_TEMPLATE } from "$constants";
import getEnvVar from "$utils/getEnvVar";

const getAccessToken = async () => {
  const AUTH0_TENANT = getEnvVar("AUTH0_TENANT");
  const API_AUDIENCE = `https://${AUTH0_TENANT}.eu.auth0.com/api/v2/`;

  try {
    const response = await authenticationClient.oauth.clientCredentialsGrant({
      audience: API_AUDIENCE,
    });
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting Auth0 token:", error);
    throw error;
  }
};

const sendMail = async (data: MailDataRequired) => {
  const apiKey = getEnvVar("SENDGRID_API_KEY");
  sgMail.setApiKey(apiKey);

  try {
    return await sgMail.send(data);
  } catch (error) {
    console.error("Error sending sendgrid email", error);
    throw error;
  }
};

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

export const sendVerificationEmail = async (userId: string, email: string) => {
  try {
    // Step 1: Get Auth0 Management API Token
    const accessToken = await getAccessToken();
    console.log(`Response access token`, accessToken);

    // Step 2: Trigger Auth0's Standard Email Verification
    const ticketResponse = await managementClient.tickets.verifyEmail({
      user_id: userId,
    });
    const { ticket } = ticketResponse.data;
    console.log(`Email verification ticket URL: ${ticket}`);

    // Step 3: Send verification email via SendGrid
    await sendMail({
      from: {
        name: "AI now AG",
        email: "no-reply@ainow.ch",
      },
      to: email,
      templateId: SG_VERIFICATION_TEMPLATE,
      dynamicTemplateData: {
        email,
        url: ticket,
      },
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    //throw new Error("Failed to send verification email.");
  }
};

export const sendWelcomeEmail = async (email: string) => {
  try {
    // Send welcome email via SendGrid
    await sendMail({
      from: {
        name: "AI now AG",
        email: "no-reply@ainow.ch",
      },
      to: email,
      templateId: SG_WELCOME_TEMPLATE,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    //throw new Error("Failed to send welcome email.");
  }
};

export const sendNotificationEmail = async (subject: string, html: string) => {
  try {
    // Send notification email via SendGrid
    await sendMail({
      from: {
        name: "AI now AG",
        email: "no-reply@ainow.ch",
      },
      to: "support@aibox-app.ch",
      bcc: "devlin.nguyen@business4you.ch",
      subject,
      html,
    });
  } catch (error) {
    console.error("Error sending notification email:", error);
    //throw new Error("Failed to send notification email.");
  }
};
