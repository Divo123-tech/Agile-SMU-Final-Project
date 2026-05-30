import bcrypt from "bcrypt";
import { pool } from "../db";
import { ServiceError, UnauthorizedError } from "../errors";
import { signAccessToken } from "../lib/jwt";
import type { AccountRow, LoginInput, LoginResponse } from "../types/account";

export async function login(input: LoginInput): Promise<LoginResponse> {
  try {
    const { rows } = await pool.query<AccountRow>(
      "SELECT id, email, password_hash FROM accounts WHERE email = $1 LIMIT 1",
      [input.email]
    );

    if (rows.length === 0) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const account = rows[0];
    const passwordMatches = await bcrypt.compare(
      input.password,
      account.password_hash
    );

    if (!passwordMatches) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = signAccessToken({
      sub: account.id,
      email: account.email,
    });

    return {
      token,
      account: {
        id: account.id,
        email: account.email,
      },
    };
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      throw err;
    }

    console.error(`login failed for email=${input.email}:`, err);
    throw new ServiceError("Unable to sign in. Please try again later.");
  }
}
