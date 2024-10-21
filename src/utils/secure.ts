import crypto from "crypto";

// Ensure the ENCRYPTION_KEY is set and is a valid 32-byte hex string
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";

const IV_LENGTH = 16; // AES block size in bytes
const ALGORITHM = "aes-256-cbc";

// Function to encrypt the API key
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"), // Specify 'hex' encoding here
    iv,
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(encryptedText: string): string {
  const textParts = encryptedText.split(":");
  const iv = Buffer.from(textParts.shift()!, "hex");
  const encryptedTextBuffer = Buffer.from(textParts.join(""), "hex");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"), // Specify 'hex' encoding here
    iv,
  );
  let decrypted = decipher.update(encryptedTextBuffer, undefined, "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
