import { beforeEach, describe, expect, it, vi } from "vitest";
import { pool } from "../db";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../errors";
import { accountRow, accountResponse } from "../test/fixtures/account";
import { getAccountById, updateAccount } from "./account.service";

vi.mock("../db", () => ({
  pool: { query: vi.fn() },
}));

vi.mock("../lib/jwt", () => ({
  signAccessToken: vi.fn(() => "new-token"),
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

import bcrypt from "bcrypt";

const mockQuery = vi.mocked(pool.query);
const mockCompare = vi.mocked(bcrypt.compare);
const mockHash = vi.mocked(bcrypt.hash);

describe("Account service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAccountById", () => {
    it("returns the account profile", async () => {
      mockQuery.mockResolvedValue({ rows: [accountRow], rowCount: 1 } as never);

      await expect(getAccountById(1)).resolves.toEqual(accountResponse);
    });

    it("throws NotFoundError when missing", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as never);

      await expect(getAccountById(99)).rejects.toThrow(NotFoundError);
    });

    it("wraps database errors", async () => {
      mockQuery.mockRejectedValue(new Error("db"));

      await expect(getAccountById(1)).rejects.toThrow("Unable to load account");
    });
  });

  describe("updateAccount", () => {
    it("throws when no updatable fields are provided", async () => {
      await expect(
        updateAccount(1, { currentPassword: "old" })
      ).rejects.toThrow(ValidationError);
    });

    it("updates allergies when current password matches", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ ...accountRow, allergies: [] }],
          rowCount: 1,
        } as never)
        .mockResolvedValueOnce({
          rows: [{ ...accountRow, allergies: ["nuts", "dairy"] }],
          rowCount: 1,
        } as never);
      mockCompare.mockResolvedValue(true as never);

      const result = await updateAccount(1, {
        currentPassword: "securePassword123",
        allergies: ["nuts", "dairy"],
      });

      expect(result.account.allergies).toEqual(["nuts", "dairy"]);
    });

    it("updates email when current password matches", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [accountRow], rowCount: 1 } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never)
        .mockResolvedValueOnce({
          rows: [{ ...accountRow, email: "new@example.com" }],
          rowCount: 1,
        } as never);
      mockCompare.mockResolvedValue(true as never);

      const result = await updateAccount(1, {
        currentPassword: "securePassword123",
        email: "new@example.com",
      });

      expect(result.account.email).toBe("new@example.com");
      expect(result.token).toBe("new-token");
    });

    it("throws UnauthorizedError when current password is wrong", async () => {
      mockQuery.mockResolvedValue({ rows: [accountRow], rowCount: 1 } as never);
      mockCompare.mockResolvedValue(false as never);

      await expect(
        updateAccount(1, {
          currentPassword: "wrong",
          newPassword: "newSecurePassword1!",
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it("updates password when current password matches", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [accountRow], rowCount: 1 } as never)
        .mockResolvedValueOnce({
          rows: [accountRow],
          rowCount: 1,
        } as never);
      mockCompare.mockResolvedValue(true as never);
      mockHash.mockResolvedValue("new-hash" as never);

      await updateAccount(1, {
        currentPassword: "securePassword123",
        newPassword: "newSecurePassword1!",
      });

      expect(mockHash).toHaveBeenCalledWith("newSecurePassword1!", 10);
    });

    it("throws when email is already registered", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [accountRow], rowCount: 1 } as never)
        .mockResolvedValueOnce({ rows: [{ id: 2 }], rowCount: 1 } as never);
      mockCompare.mockResolvedValue(true as never);

      await expect(
        updateAccount(1, {
          currentPassword: "securePassword123",
          email: "taken@example.com",
        })
      ).rejects.toThrow("email is already registered");
    });

    it("throws when nothing changed", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [accountRow], rowCount: 1 } as never);
      mockCompare.mockResolvedValue(true as never);

      await expect(
        updateAccount(1, {
          currentPassword: "securePassword123",
          email: accountRow.email,
        })
      ).rejects.toThrow("No changes to save");
    });

    it("maps unique violation errors", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [accountRow], rowCount: 1 } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never)
        .mockRejectedValueOnce({ code: "23505" });

      mockCompare.mockResolvedValue(true as never);

      await expect(
        updateAccount(1, {
          currentPassword: "securePassword123",
          email: "new@example.com",
        })
      ).rejects.toThrow("email is already registered");
    });

    it("maps check violation errors", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [accountRow], rowCount: 1 } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never)
        .mockRejectedValueOnce({ code: "23514" });

      mockCompare.mockResolvedValue(true as never);

      await expect(
        updateAccount(1, {
          currentPassword: "securePassword123",
          email: "new@example.com",
        })
      ).rejects.toThrow("email does not meet database requirements");
    });

    it("wraps unexpected database errors", async () => {
      mockQuery.mockRejectedValue(new Error("db"));

      await expect(
        updateAccount(1, {
          currentPassword: "securePassword123",
          email: "new@example.com",
        })
      ).rejects.toThrow("Unable to update account");
    });
  });
});
