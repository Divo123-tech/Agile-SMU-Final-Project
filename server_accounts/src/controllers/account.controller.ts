import type { NextFunction, Response } from "express";
import {
  NotFoundError,
  ServiceError,
  UnauthorizedError,
  ValidationError,
} from "../errors";
import type { AuthenticatedRequest } from "../middleware/requireAuth";
import { getAccountById, updateAccount } from "../services/account.service";
import { VALID_ALLERGENS } from "../lib/allergens";
import type { UpdateAccountInput } from "../types/account";

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function parseAllergies(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new ValidationError("allergies must be an array of strings");
  }

  const parsed: string[] = [];

  for (const item of value) {
    if (typeof item !== "string" || item.trim() === "") {
      throw new ValidationError("each allergen must be a non-empty string");
    }

    if (!VALID_ALLERGENS.includes(item as (typeof VALID_ALLERGENS)[number])) {
      throw new ValidationError(`invalid allergen: ${item}`);
    }

    parsed.push(item);
  }

  return parsed;
}

function parseUpdateAccountBody(body: unknown): UpdateAccountInput {
  if (body == null || typeof body !== "object") {
    throw new ValidationError("Request body is required");
  }

  const { currentPassword, email, newPassword, allergies } = body as Record<
    string,
    unknown
  >;

  if (typeof currentPassword !== "string" || currentPassword === "") {
    throw new ValidationError("currentPassword is required");
  }

  const input: UpdateAccountInput = { currentPassword };

  if (email !== undefined) {
    if (typeof email !== "string" || email.trim() === "") {
      throw new ValidationError("email must be a non-empty string");
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail !== email.trim()) {
      throw new ValidationError("email must be lowercase");
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw new ValidationError("email format is invalid");
    }

    input.email = normalizedEmail;
  }

  if (newPassword !== undefined) {
    if (typeof newPassword !== "string" || newPassword === "") {
      throw new ValidationError("newPassword must be a non-empty string");
    }

    input.newPassword = newPassword;
  }

  if (allergies !== undefined) {
    input.allergies = parseAllergies(allergies);
  }

  return input;
}

function handleAccountError(
  err: unknown,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof ValidationError) {
    const status =
      err.message === "email is already registered" ? 409 : 400;
    res.status(status).json({ error: err.message });
    return;
  }

  if (err instanceof UnauthorizedError) {
    res.status(401).json({ error: err.message });
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

export async function getAccountHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const account = await getAccountById(req.accountId);
    res.json(account);
  } catch (err) {
    handleAccountError(err, res, next);
  }
}

export async function updateAccountHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = parseUpdateAccountBody(req.body);
    const result = await updateAccount(req.accountId, input);
    res.json(result);
  } catch (err) {
    handleAccountError(err, res, next);
  }
}
