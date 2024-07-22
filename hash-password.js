/**
 * Prints a salted and hashed string using scrypt. Can be used to create passwords
 * and manually store them in our MongoDB until we have a better interface.
 * `node hash-password.js MY_PASSWORD`
 */
import process from "process";
import crypto from "crypto";
import { promisify } from "util";

const scrypt = promisify(crypto.scrypt);

const hash = async (password) => {
  const salt = crypto.randomBytes(32).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}.${derivedKey.toString("hex")}`;
};

console.log(await hash(process.argv[2]));
