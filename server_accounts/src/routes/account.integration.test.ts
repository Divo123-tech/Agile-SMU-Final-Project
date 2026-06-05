process.env.JWT_SECRET = "test-jwt-secret";

import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceError, UnauthorizedError } from "../errors";
import { signAccessToken } from "../lib/jwt";
import * as accountService from "../services/account.service";
import {
  accountResponse,
  loginResponse,
} from "../test/fixtures/account";

vi.mock("../services/account.service", () => ({
  getAccountById: vi.fn(),
  updateAccount: vi.fn(),
}));

import app from "../app";

const mockGetAccount = vi.mocked(accountService.getAccountById);
const mockUpdateAccount = vi.mocked(accountService.updateAccount);

describe("Account API", () => {
  let token: string;

  beforeAll(() => {
    token = signAccessToken({ sub: 1, email: "user@example.com", isAdmin: true });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /account", () => {
    it("returns 401 without a token", async () => {
      const res = await request(app).get("/account");

      expect(res.status).toBe(401);
      expect(mockGetAccount).not.toHaveBeenCalled();
    });

    it("returns 200 with the account profile", async () => {
      mockGetAccount.mockResolvedValue(accountResponse);

      const res = await request(app)
        .get("/account")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(accountResponse);
      expect(mockGetAccount).toHaveBeenCalledWith(1);
    });
  });

  describe("PATCH /account", () => {
    it("returns 400 when currentPassword is missing", async () => {
      const res = await request(app)
        .patch("/account")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "new@example.com" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "currentPassword is required" });
    });

    it("returns 200 with a new token when updated", async () => {
      mockUpdateAccount.mockResolvedValue(loginResponse);

      const res = await request(app)
        .patch("/account")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "securePassword123",
          email: "new@example.com",
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(loginResponse);
    });

    it("returns 401 when current password is wrong", async () => {
      mockUpdateAccount.mockRejectedValue(
        new UnauthorizedError("Current password is incorrect")
      );

      const res = await request(app)
        .patch("/account")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "wrong",
          newPassword: "newSecurePassword1!",
        });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Current password is incorrect" });
    });

    it("returns 503 when the service fails", async () => {
      mockUpdateAccount.mockRejectedValue(
        new ServiceError("Unable to update account. Please try again later.")
      );

      const res = await request(app)
        .patch("/account")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "securePassword123",
          email: "new@example.com",
        });

      expect(res.status).toBe(503);
    });
  });
});
