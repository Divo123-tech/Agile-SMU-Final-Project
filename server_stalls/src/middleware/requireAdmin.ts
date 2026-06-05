import type { NextFunction, Response } from "express";
import { pool } from "../db";
import { ForbiddenError } from "../errors";
import type { AuthenticatedRequest } from "./requireAuth";

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { rows } = await pool.query<{ is_admin: boolean }>(
      "SELECT is_admin FROM accounts WHERE id = $1 LIMIT 1",
      [req.accountId]
    );

    if (rows.length === 0 || !rows[0].is_admin) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    next();
  } catch (err) {
    if (err instanceof ForbiddenError) {
      res.status(403).json({ error: err.message });
      return;
    }

    console.error(`requireAdmin failed for account=${req.accountId}:`, err);
    res.status(503).json({ error: "Unable to verify admin access" });
  }
}
