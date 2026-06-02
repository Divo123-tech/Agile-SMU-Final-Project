import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import { pool } from "../db";
import { accountRow, loginBody, loginResponse } from "../test/fixtures/account";
import { login } from "./login.service";
import * as jwtLib from "../lib/jwt";

vi.mock("../db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("../lib/jwt", () => ({
  signAccessToken: vi.fn(),
}));

const mockQuery = vi.mocked(pool.query);
const mockCompare = vi.mocked(bcrypt.compare);
const mockSignAccessToken = vi.mocked(jwtLib.signAccessToken);

describe("Login service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignAccessToken.mockReturnValue(loginResponse.token);
  });

  it("returns a JWT and account when credentials are valid", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [accountRow] } as never);
    mockCompare.mockResolvedValueOnce(true as never);

    const result = await login(loginBody);

    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT id, email, password_hash, allergies FROM accounts WHERE email = $1 LIMIT 1",
      [loginBody.email]
    );
    expect(mockCompare).toHaveBeenCalledWith(
      loginBody.password,
      accountRow.password_hash
    );
    expect(mockSignAccessToken).toHaveBeenCalledWith({
      sub: accountRow.id,
      email: accountRow.email,
    });
    expect(result).toEqual(loginResponse);
  });

  it("throws UnauthorizedError when the account does not exist", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);

    await expect(login(loginBody)).rejects.toMatchObject({
      name: "UnauthorizedError",
      message: "Invalid email or password",
    });

    expect(mockCompare).not.toHaveBeenCalled();
  });

  it("throws UnauthorizedError when the password is wrong", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [accountRow] } as never);
    mockCompare.mockResolvedValueOnce(false as never);

    await expect(login(loginBody)).rejects.toMatchObject({
      name: "UnauthorizedError",
      message: "Invalid email or password",
    });
  });

  it("throws ServiceError when the query fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("connection refused"));

    await expect(login(loginBody)).rejects.toMatchObject({
      name: "ServiceError",
      message: "Unable to sign in. Please try again later.",
    });

    consoleSpy.mockRestore();
  });
});
