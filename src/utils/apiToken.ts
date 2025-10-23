import jwt from "jsonwebtoken";
import type { Session } from "lucia";

const jwtSecret = import.meta.env.API_JWT_SECRET || "254106bc6b8951a96357f87b";
export function createApiToken(session: Session) {
  const payload = {
    sub: session.userId,
    sid: session.id, // Lucia session ID
  };

  // Calculate remaining time until Lucia session expiry
  const expiresInSeconds = Math.max(
    0,
    Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000),
  );

  if (expiresInSeconds === 0) {
    throw new Error("Lucia session already expired");
  }

  // Sign JWT with same lifespan as Lucia session
  return jwt.sign(payload, jwtSecret, {
    expiresIn: expiresInSeconds, // dynamic TTL
  });
}

export default createApiToken;
