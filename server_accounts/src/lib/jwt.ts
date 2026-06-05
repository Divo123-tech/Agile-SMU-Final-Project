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

function parseSubject(sub: unknown): number {
  if (typeof sub === "number" && Number.isInteger(sub) && sub > 0) {
    return sub;
  }

  if (typeof sub === "string" && /^\d+$/.test(sub)) {
    return Number(sub);
  }

  throw new Error("Invalid token payload");
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());

  if (decoded == null || typeof decoded !== "object") {
    throw new Error("Invalid token payload");
  }

  const payload = decoded as Record<string, unknown>;
  const { sub, email, isAdmin } = payload;

  if (typeof email !== "string") {
    throw new Error("Invalid token payload");
  }

  return {
    sub: parseSubject(sub),
    email,
    isAdmin: isAdmin === true,
  };
}
