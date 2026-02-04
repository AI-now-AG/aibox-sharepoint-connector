import crypto from "crypto";

const IV_LENGTH = 16; // AES block size in bytes
const ALGORITHM = "aes-256-cbc";
// Ensure the ENCRYPTION_KEY is set and is a valid 32-byte hex string
const ENCRYPTION_KEY =
  "b23d8f13bf1e2cda7d3ca36645f62b61c6d01a5a745377e27291a1977bec2ab4";

/**
 * Check if text is already in encrypted format
 * Encrypted format: 32-char hex IV + ":" + hex encrypted data
 */
function isAlreadyEncrypted(text: string): boolean {
  if (!text || !text.includes(":")) {
    return false;
  }
  const parts = text.split(":");
  const ivPart = parts[0];
  // IV should be exactly 32 hex characters (16 bytes)
  if (ivPart.length !== IV_LENGTH * 2) {
    return false;
  }
  // Check if IV part is valid hex
  return /^[0-9a-fA-F]+$/.test(ivPart);
}

// Function to encrypt the API key
export function encrypt(text: string): string {
  try {
    // Skip if already encrypted to prevent double-encryption
    if (isAlreadyEncrypted(text)) {
      return text;
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, "hex"), // Specify 'hex' encoding here
      iv,
    );
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error(
      `Encrypt the text that ends with the ${text.substring(text.length - 10)} error`,
      error,
    );
    return "";
  }
}

export function decrypt(encryptedText: string): string {
  try {
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
  } catch (error) {
    console.error(
      `Decrypt the text that ends with the ${encryptedText.substring(encryptedText.length - 10)} error`,
      error,
    );
    return "";
  }
}
