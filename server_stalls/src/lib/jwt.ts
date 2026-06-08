import jwt from "jsonwebtoken";

export type AccessTokenPayload = {
  sub: number;
  email: string;
  isAdmin?: boolean;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
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
