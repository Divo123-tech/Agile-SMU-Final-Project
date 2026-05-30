import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceError, UnauthorizedError } from "../errors";
import * as loginService from "../services/login.service";
import { loginBody, loginResponse } from "../test/fixtures/account";

vi.mock("../services/login.service", () => ({
  login: vi.fn(),
}));

import app from "../app";

const mockLogin = vi.mocked(loginService.login);

describe("Login API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /login", () => {
    it("returns 200 with token and account", async () => {
      mockLogin.mockResolvedValue(loginResponse);

      const res = await request(app).post("/login").send(loginBody);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(loginResponse);
      expect(mockLogin).toHaveBeenCalledWith(loginBody);
    });

    it("returns 400 when the body is invalid", async () => {
      const res = await request(app)
        .post("/login")
        .send({ email: "user@example.com" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "password is required" });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("returns 401 for invalid credentials", async () => {
      mockLogin.mockRejectedValue(new UnauthorizedError("Invalid email or password"));

      const res = await request(app).post("/login").send(loginBody);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Invalid email or password" });
    });

    it("returns 503 when the service fails", async () => {
      mockLogin.mockRejectedValue(
        new ServiceError("Unable to sign in. Please try again later.")
      );

      const res = await request(app).post("/login").send(loginBody);

      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        error: "Unable to sign in. Please try again later.",
      });
    });
  });
});
