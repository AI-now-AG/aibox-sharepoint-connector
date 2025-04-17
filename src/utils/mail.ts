import sgMail, { type MailDataRequired } from "@sendgrid/mail";
import getEnvVar from "$utils/getEnvVar";

export const sendMail = async (data: MailDataRequired) => {
  const apiKey = getEnvVar("SENDGRID_API_KEY");
  sgMail.setApiKey(apiKey);

  try {
    return await sgMail.send(data);
  } catch (error) {
    console.error("Error sending sendgrid email", error);
    throw error;
  }
};

export default sendMail;
