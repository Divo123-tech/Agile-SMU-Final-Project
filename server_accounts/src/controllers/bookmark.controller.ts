import type { NextFunction, Response } from "express";
import {
  NotFoundError,
  ServiceError,
  ValidationError,
} from "../errors";
import type { AuthenticatedRequest } from "../middleware/requireAuth";
import {
  addBookmark,
  listBookmarkedDishes,
  removeBookmark,
} from "../services/bookmark.service";

function parseDishIdParam(raw: string | string[]): number {
  const dishId = Number(Array.isArray(raw) ? raw[0] : raw);

  if (!Number.isInteger(dishId) || dishId <= 0) {
    throw new ValidationError("dishId must be a positive integer");
  }

  return dishId;
}

function handleBookmarkError(
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

export async function listMyDishesHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await listBookmarkedDishes(req.accountId);
    res.json(result);
  } catch (err) {
    handleBookmarkError(err, res, next);
  }
}

export async function addBookmarkHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dishId = parseDishIdParam(req.params.dishId);
    const dish = await addBookmark(req.accountId, dishId);
    res.status(201).json(dish);
  } catch (err) {
    handleBookmarkError(err, res, next);
  }
}

export async function removeBookmarkHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dishId = parseDishIdParam(req.params.dishId);
    await removeBookmark(req.accountId, dishId);
    res.status(204).send();
  } catch (err) {
    handleBookmarkError(err, res, next);
  }
}
