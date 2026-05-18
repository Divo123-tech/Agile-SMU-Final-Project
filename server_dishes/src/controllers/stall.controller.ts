import type { NextFunction, Request, Response } from "express";
import { NotFoundError, ServiceError } from "../errors";
import { getStallMenu } from "../services/stall.service";

export async function getStallById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const stallId = Number(req.params.id);

  if (!Number.isInteger(stallId) || stallId <= 0) {
    res.status(400).json({ error: "stall id must be a positive integer" });
    return;
  }

  try {
    const menu = await getStallMenu(stallId);
    res.json(menu);
  } catch (err) {
    if (err instanceof NotFoundError) {
      res.status(404).json({
        error: err.message,
        stall: null,
        categories: [],
      });
      return;
    }

    if (err instanceof ServiceError) {
      res.status(503).json({ error: err.message });
      return;
    }

    next(err);
  }
}
