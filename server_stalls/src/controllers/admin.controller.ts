import type { NextFunction, Response } from "express";
import {
  NotFoundError,
  ServiceError,
  ValidationError,
} from "../errors";
import type { AuthenticatedRequest } from "../middleware/requireAuth";
import {
  getAdminStallById,
  listPendingStalls,
  setStallStatus,
} from "../services/admin.service";
import { getAdminStallMenu } from "../services/stall-menu.service";
import type { StallStatus } from "../types/stall";

function parseStallIdParam(raw: string | string[]): number {
  const id = Number(Array.isArray(raw) ? raw[0] : raw);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError("stall id must be a positive integer");
  }

  return id;
}

function parseReviewBody(body: unknown): {
  status: StallStatus;
  adminNotes?: string;
} {
  if (body == null || typeof body !== "object") {
    throw new ValidationError("Request body is required");
  }

  const { status, adminNotes } = body as Record<string, unknown>;

  if (status !== "approved" && status !== "rejected") {
    throw new ValidationError("status must be approved or rejected");
  }

  const input: { status: StallStatus; adminNotes?: string } = { status };

  if (adminNotes !== undefined) {
    if (typeof adminNotes !== "string") {
      throw new ValidationError("adminNotes must be a string");
    }
    input.adminNotes = adminNotes;
  }

  return input;
}

function handleAdminError(
  err: unknown,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }

  if (err instanceof ServiceError) {
    res.status(503).json({ error: err.message });
    return;
  }

  next(err);
}

export async function listPendingStallsHandler(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await listPendingStalls();
    res.json(result);
  } catch (err) {
    handleAdminError(err, res, next);
  }
}

export async function getPendingStallHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stallId = parseStallIdParam(req.params.id as string | string[]);
    const stall = await getAdminStallById(stallId);
    res.json(stall);
  } catch (err) {
    handleAdminError(err, res, next);
  }
}

export async function getPendingStallMenuHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stallId = parseStallIdParam(req.params.id as string | string[]);
    const menu = await getAdminStallMenu(stallId);
    res.json(menu);
  } catch (err) {
    handleAdminError(err, res, next);
  }
}

export async function reviewStallHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stallId = parseStallIdParam(req.params.id as string | string[]);
    const { status, adminNotes } = parseReviewBody(req.body);
    const stall = await setStallStatus(stallId, status, adminNotes);
    res.json(stall);
  } catch (err) {
    handleAdminError(err, res, next);
  }
}
