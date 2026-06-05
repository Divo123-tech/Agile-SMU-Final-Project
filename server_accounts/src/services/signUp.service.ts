import bcrypt from "bcrypt";
import { pool } from "../db";
import { ServiceError, ValidationError } from "../errors";
import type { AccountResponse, AccountRow, SignUpInput } from "../types/account";

const BCRYPT_ROUNDS = 10;

function accountRowToResponse(row: AccountRow): AccountResponse {
  return {
    id: row.id,
    email: row.email,
    allergies: [],
    isAdmin: row.is_admin ?? false,
  };
}

export async function signUp(input: SignUpInput): Promise<AccountResponse> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  try {
    const { rows } = await pool.query<AccountRow>(
      `INSERT INTO accounts (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, password_hash`,
      [input.email, passwordHash]
    );

    return accountRowToResponse(rows[0]);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ValidationError("email is already registered");
    }

    if (isCheckViolation(err)) {
      throw new ValidationError("email does not meet database requirements");
    }

    console.error(`signUp failed for email=${input.email}:`, err);
    throw new ServiceError("Unable to create account. Please try again later.");
  }
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}

function isCheckViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23514"
  );
}
