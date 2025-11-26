import ticketsManager from "$data/auth0/tickets-manager";
import { isProd } from "$utils/env";
import {
  SG_PASSWORD_RESET_TEMPLATE,
  SG_VERIFICATION_TEMPLATE,
} from "$constants";
import sendMail from "$utils/mail";
import { getEnvVar } from "$utils/env";

export const sendPasswordResetEmail = async (userId: string, email: string) => {
  try {
    const redirectUrl = isProd()
      ? "https://aibox-app.com/"
      : "https://test.aibox-app.com/";
    // Step 1: Create password reset ticket
    const ticketResponse = await ticketsManager.createPasswordResetTicket({
      user_id: userId,
      result_url: redirectUrl,
    });
    const { ticket } = ticketResponse.data;
    console.log(`Password reset - ticket response: ${ticket}`);

    // Step 2: Send verification email via SendGrid
    await sendMail({
      from: {
        name: "AI now AG",
        email: "no-reply@ainow.ch",
      },
      to: email,
      templateId: SG_PASSWORD_RESET_TEMPLATE,
      dynamicTemplateData: {
        url: ticket,
      },
    });
    console.log(`Password reset email sent successfully: ${email}`);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    //throw new Error("Failed to send password reset email.");
  }
};

export const sendVerificationEmail = async (userId: string, email: string) => {
  try {
    // Step 1: Create verify email ticket
    const ticketResponse = await ticketsManager.createVerifyEmailTicket({
      user_id: userId,
    });
    const { ticket } = ticketResponse.data;
    console.log(`Verification email - ticket response: ${ticket}`);

    // Step 2: Send verification email via SendGrid
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
    console.log(`Verification email sent successfully: ${email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
    //throw new Error("Failed to send verification email.");
  }
};

export const sendNotificationEmail = async (subject: string, html: string) => {
  const env = getEnvVar("NODE_ENV") || "development";
  const subjectPrefix = env == "production" ? "aibox" : "aibox-dev";
  const subjectStr = `${subjectPrefix} - ${subject}`;

  try {
    // Send notification email via SendGrid
    await sendMail({
      from: {
        name: "AI now AG",
        email: "no-reply@ainow.ch",
      },
      to: "support@aibox-app.ch",
      subject: subjectStr,
      html,
    });

    console.log(`Notification email sent successfully: ${subjectStr}`);
  } catch (error) {
    console.error("Error sending notification email:", error);
    //throw new Error("Failed to send notification email.");
  }
};
