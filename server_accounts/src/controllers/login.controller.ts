import type { NextFunction, Request, Response } from "express";
import { ServiceError, UnauthorizedError, ValidationError } from "../errors";
import { login } from "../services/login.service";
import type { LoginInput } from "../types/account";

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function parseLoginBody(body: unknown): LoginInput {
  if (body == null || typeof body !== "object") {
    throw new ValidationError("Request body is required");
  }

  const { email, password } = body as Record<string, unknown>;

  if (typeof email !== "string" || email.trim() === "") {
    throw new ValidationError("email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new ValidationError("email format is invalid");
  }

  if (typeof password !== "string" || password === "") {
    throw new ValidationError("password is required");
  }

  return {
    email: normalizedEmail,
    password,
  };
}

function handleLoginError(
  err: unknown,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof UnauthorizedError) {
    res.status(401).json({ error: err.message });
    return;
  }

  if (err instanceof ServiceError) {
    res.status(503).json({ error: err.message });
    return;
  }

  next(err);
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = parseLoginBody(req.body);
    const result = await login(input);
    res.json(result);
  } catch (err) {
    handleLoginError(err, res, next);
  }
}
