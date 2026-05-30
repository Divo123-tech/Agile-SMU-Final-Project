import type { NextFunction, Request, Response } from "express";
import { NotFoundError, ServiceError, ValidationError } from "../errors";
import { createDish, deleteDish, getDishById, updateDish } from "../services/dish.service";
import type { CreateDishInput, UpdateDishInput } from "../types/dish";

function parseDishIdParam(id: string | string[]): number {
  const raw = Array.isArray(id) ? id[0] : id;
  const dishId = Number(raw);
  if (!Number.isInteger(dishId) || dishId <= 0) {
    throw new ValidationError("dish id must be a positive integer");
  }
  return dishId;
}

function parseDishBody(
  body: unknown,
  options: { requireStallId: boolean }
): CreateDishInput | UpdateDishInput {
  if (body == null || typeof body !== "object") {
    throw new ValidationError("Request body is required");
  }

  const { stallId, name, description, allergens, category } = body as Record<
    string,
    unknown
  >;

  let parsedStallId: number | undefined;
  if (options.requireStallId) {
    parsedStallId = Number(stallId);
    if (!Number.isInteger(parsedStallId) || parsedStallId <= 0) {
      throw new ValidationError("stallId must be a positive integer");
    }
  } else if (stallId !== undefined) {
    parsedStallId = Number(stallId);
    if (!Number.isInteger(parsedStallId) || parsedStallId <= 0) {
      throw new ValidationError("stallId must be a positive integer");
    }
  }

  if (typeof name !== "string" || name.trim() === "") {
    throw new ValidationError("name is required");
  }

  if (typeof description !== "string" || description.trim() === "") {
    throw new ValidationError("description is required");
  }

  if (allergens !== undefined && !Array.isArray(allergens)) {
    throw new ValidationError("allergens must be an array of strings");
  }

  const parsedAllergens = (allergens ?? []).map((a) => {
    if (typeof a !== "string" || a.trim() === "") {
      throw new ValidationError("each allergen must be a non-empty string");
    }
    return a.trim();
  });

  if (category !== undefined && (typeof category !== "string" || category.trim() === "")) {
    throw new ValidationError("category must be a non-empty string when provided");
  }

  const base = {
    name: name.trim(),
    description: description.trim(),
    allergens: parsedAllergens,
    category: typeof category === "string" ? category.trim() : undefined,
  };

  if (options.requireStallId) {
    return { ...base, stallId: parsedStallId! };
  }

  return { ...base, stallId: parsedStallId };
}

function parseCreateDishBody(body: unknown): CreateDishInput {
  return parseDishBody(body, { requireStallId: true }) as CreateDishInput;
}

function parseUpdateDishBody(body: unknown): UpdateDishInput {
  return parseDishBody(body, { requireStallId: false }) as UpdateDishInput;
}

function handleDishError(
  err: unknown,
  res: Response,
  next: NextFunction,
  options?: { includeValidation?: boolean }
): void {
  if (options?.includeValidation && err instanceof ValidationError) {
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

export async function getDishByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dishId = parseDishIdParam(req.params.id as string | string[]);
    const dish = await getDishById(dishId);
    res.json(dish);
  } catch (err) {
    handleDishError(err, res, next, { includeValidation: true });
  }
}

export async function deleteDishHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dishId = parseDishIdParam(req.params.id as string | string[]);
    const dish = await deleteDish(dishId);
    res.json(dish);
  } catch (err) {
    handleDishError(err, res, next, { includeValidation: true });
  }
}

export async function updateDishHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dishId = parseDishIdParam(req.params.id as string | string[]);
    const input = parseUpdateDishBody(req.body);
    const dish = await updateDish(dishId, input);
    res.json(dish);
  } catch (err) {
    handleDishError(err, res, next, { includeValidation: true });
  }
}

export async function createDishHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = parseCreateDishBody(req.body);
    const dish = await createDish(input);
    res.status(201).json(dish);
  } catch (err) {
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
}
