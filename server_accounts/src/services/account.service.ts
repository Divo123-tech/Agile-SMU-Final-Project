import bcrypt from "bcrypt";
import { pool } from "../db";
import {
  allergiesEqual,
  normalizeAllergies,
} from "../lib/allergens";
import {
  NotFoundError,
  ServiceError,
  UnauthorizedError,
  ValidationError,
} from "../errors";
import { signAccessToken } from "../lib/jwt";
import type {
  AccountResponse,
  AccountRow,
  LoginResponse,
  UpdateAccountInput,
} from "../types/account";

const BCRYPT_ROUNDS = 10;

const ACCOUNT_SELECT =
  "SELECT id, email, password_hash, allergies, is_admin FROM accounts WHERE id = $1 LIMIT 1";

function accountRowToResponse(row: AccountRow): AccountResponse {
  return {
    id: row.id,
    email: row.email,
    allergies: normalizeAllergies(row.allergies ?? []),
    isAdmin: row.is_admin,
  };
}

export async function getAccountById(
  accountId: number
): Promise<AccountResponse> {
  try {
    const { rows } = await pool.query<AccountRow>(ACCOUNT_SELECT, [accountId]);

    if (rows.length === 0) {
      throw new NotFoundError("Account not found");
    }

    return accountRowToResponse(rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }

    console.error(`getAccountById failed for id=${accountId}:`, err);
    throw new ServiceError("Unable to load account. Please try again later.");
  }
}

export async function updateAccount(
  accountId: number,
  input: UpdateAccountInput
): Promise<LoginResponse> {
  const nextEmail = input.email?.trim().toLowerCase();
  const hasEmailChange = nextEmail !== undefined;
  const hasPasswordChange = input.newPassword !== undefined;
  const hasAllergiesChange = input.allergies !== undefined;

  if (!hasEmailChange && !hasPasswordChange && !hasAllergiesChange) {
    throw new ValidationError(
      "Provide a new email, newPassword, and/or allergies to update"
    );
  }

  try {
    const { rows } = await pool.query<AccountRow>(ACCOUNT_SELECT, [accountId]);

    if (rows.length === 0) {
      throw new NotFoundError("Account not found");
    }

    const account = rows[0];
    const currentPasswordMatches = await bcrypt.compare(
      input.currentPassword,
      account.password_hash
    );

    if (!currentPasswordMatches) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    let email = account.email;
    let passwordHash = account.password_hash;
    let allergies = normalizeAllergies(account.allergies ?? []);

    if (hasEmailChange && nextEmail !== account.email) {
      email = nextEmail!;
      const emailTaken = await pool.query<{ id: number }>(
        "SELECT id FROM accounts WHERE email = $1 AND id <> $2 LIMIT 1",
        [email, accountId]
      );

      if (emailTaken.rows.length > 0) {
        throw new ValidationError("email is already registered");
      }
    }

    if (hasPasswordChange) {
      passwordHash = await bcrypt.hash(input.newPassword!, BCRYPT_ROUNDS);
    }

    if (hasAllergiesChange) {
      const nextAllergies = normalizeAllergies(input.allergies!);
      if (!allergiesEqual(allergies, nextAllergies)) {
        allergies = nextAllergies;
      }
    }

    const nothingChanged =
      email === account.email &&
      passwordHash === account.password_hash &&
      allergiesEqual(allergies, account.allergies ?? []);

    if (nothingChanged) {
      throw new ValidationError("No changes to save");
    }

    const { rows: updatedRows } = await pool.query<AccountRow>(
      `UPDATE accounts
       SET email = $1, password_hash = $2, allergies = $3
       WHERE id = $4
       RETURNING id, email, password_hash, allergies`,
      [email, passwordHash, allergies, accountId]
    );

    const updated = accountRowToResponse(updatedRows[0]);
    const token = signAccessToken({
      sub: updated.id,
      email: updated.email,
      isAdmin: updated.isAdmin,
    });

    return { token, account: updated };
  } catch (err) {
    if (
      err instanceof ValidationError ||
      err instanceof UnauthorizedError ||
      err instanceof NotFoundError
    ) {
      throw err;
    }

    if (isUniqueViolation(err)) {
      throw new ValidationError("email is already registered");
    }

    if (isCheckViolation(err)) {
      throw new ValidationError("email does not meet database requirements");
    }

    console.error(`updateAccount failed for id=${accountId}:`, err);
    throw new ServiceError("Unable to update account. Please try again later.");
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
