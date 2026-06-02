import jwt, { type SignOptions } from "jsonwebtoken";
import type { AccessTokenPayload } from "../types/account";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, getJwtSecret(), options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());

  if (decoded == null || typeof decoded !== "object") {
    throw new Error("Invalid token payload");
  }

  const { sub, email } = decoded as AccessTokenPayload;

  if (typeof sub !== "number" || typeof email !== "string") {
    throw new Error("Invalid token payload");
  }

  return { sub, email };
}
