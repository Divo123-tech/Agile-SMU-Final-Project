import type { NextFunction, Request, Response } from "express";
import { ServiceError, ValidationError } from "../errors";
import { signUp } from "../services/signUp.service";
import type { SignUpInput } from "../types/account";

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function parseSignUpBody(body: unknown): SignUpInput {
  if (body == null || typeof body !== "object") {
    throw new ValidationError("Request body is required");
  }

  const { email, password } = body as Record<string, unknown>;

  if (typeof email !== "string" || email.trim() === "") {
    throw new ValidationError("email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail !== email.trim()) {
    throw new ValidationError("email must be lowercase");
  }

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

function handleSignUpError(
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

  if (err instanceof ServiceError) {
    res.status(503).json({ error: err.message });
    return;
  }

  next(err);
}

export async function signUpHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = parseSignUpBody(req.body);
    const account = await signUp(input);
    res.status(201).json(account);
  } catch (err) {
    handleSignUpError(err, res, next);
  }
}
