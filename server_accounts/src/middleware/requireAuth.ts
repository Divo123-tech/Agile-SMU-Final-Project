import type { NextFunction, Request, RequestHandler, Response } from "express";
import { verifyAccessToken } from "../lib/jwt";

export type AuthenticatedRequest = Request & {
  accountId: number;
  accountEmail: string;
};

/** Bridges AuthenticatedRequest handlers to Express Router typing. */
export function asAuthHandler(
  handler: (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => void | Promise<void>
): RequestHandler {
  return handler as RequestHandler;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;

  if (typeof header !== "string" || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const authReq = req as AuthenticatedRequest;
    authReq.accountId = payload.sub;
    authReq.accountEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
