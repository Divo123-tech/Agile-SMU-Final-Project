import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceError, UnauthorizedError } from "../errors";
import { loginBody, loginResponse } from "../test/fixtures/account";
import { createMockNext, createMockReq, createMockRes } from "../test/helpers";
import { loginHandler } from "./login.controller";
import * as loginService from "../services/login.service";

vi.mock("../services/login.service", () => ({
  login: vi.fn(),
}));

const mockLogin = vi.mocked(loginService.login);

describe("Login controller", () => {
  const res = createMockRes();
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = createMockNext();
  });

  describe("POST /login (loginHandler)", () => {
    it("returns 200 with token and account", async () => {
      mockLogin.mockResolvedValue(loginResponse);

      await loginHandler(createMockReq({ body: loginBody }), res, next);

      expect(mockLogin).toHaveBeenCalledWith(loginBody);
      expect(res.json).toHaveBeenCalledWith(loginResponse);
      expect(res.status).not.toHaveBeenCalled();
    });

    it.each([
      [null, "Request body is required"],
      [{}, "email is required"],
      [{ email: "not-an-email", password: "secret" }, "email format is invalid"],
      [{ email: "user@example.com" }, "password is required"],
    ])("returns 400 for invalid body %j", async (body, errorMessage) => {
      await loginHandler(createMockReq({ body }), res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("returns 401 for invalid credentials", async () => {
      mockLogin.mockRejectedValue(new UnauthorizedError("Invalid email or password"));

      await loginHandler(createMockReq({ body: loginBody }), res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid email or password" });
    });

    it("returns 503 when the service fails", async () => {
      mockLogin.mockRejectedValue(
        new ServiceError("Unable to sign in. Please try again later.")
      );

      await loginHandler(createMockReq({ body: loginBody }), res, next);

      expect(res.status).toHaveBeenCalledWith(503);
    });
  });
});
