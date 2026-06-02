import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import { pool } from "../db";
import { accountRow, accountResponse, signUpBody } from "../test/fixtures/account";
import { signUp } from "./signUp.service";

vi.mock("../db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
  },
}));

const mockQuery = vi.mocked(pool.query);
const mockHash = vi.mocked(bcrypt.hash);

describe("Sign-up service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHash.mockResolvedValue("$2b$10$hashedvalue" as never);
  });

  it("hashes the password and inserts the account", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [accountRow] } as never);

    const result = await signUp(signUpBody);

    expect(mockHash).toHaveBeenCalledWith(signUpBody.password, 10);
    expect(mockQuery).toHaveBeenCalledWith(
      `INSERT INTO accounts (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, password_hash`,
      [signUpBody.email, "$2b$10$hashedvalue"]
    );
    expect(result).toEqual({
      id: accountResponse.id,
      email: accountResponse.email,
      allergies: [],
    });
  });

  it("throws ValidationError when email is already registered", async () => {
    mockQuery.mockRejectedValueOnce({ code: "23505" });

    await expect(signUp(signUpBody)).rejects.toMatchObject({
      name: "ValidationError",
      message: "email is already registered",
    });
  });

  it("throws ValidationError when email fails database checks", async () => {
    mockQuery.mockRejectedValueOnce({ code: "23514" });

    await expect(signUp(signUpBody)).rejects.toMatchObject({
      name: "ValidationError",
      message: "email does not meet database requirements",
    });
  });

  it("throws ServiceError when the query fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("connection refused"));

    await expect(signUp(signUpBody)).rejects.toMatchObject({
      name: "ServiceError",
      message: "Unable to create account. Please try again later.",
    });

    consoleSpy.mockRestore();
  });
});
