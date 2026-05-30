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
