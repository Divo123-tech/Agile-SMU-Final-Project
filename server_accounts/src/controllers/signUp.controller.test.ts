import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceError, ValidationError } from "../errors";
import { accountResponse, signUpBody } from "../test/fixtures/account";
import { createMockNext, createMockReq, createMockRes } from "../test/helpers";
import { signUpHandler } from "./signUp.controller";
import * as signUpService from "../services/signUp.service";

vi.mock("../services/signUp.service", () => ({
  signUp: vi.fn(),
}));

const mockSignUp = vi.mocked(signUpService.signUp);

describe("Sign-up controller", () => {
  const res = createMockRes();
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = createMockNext();
  });

  describe("POST /sign-up (signUpHandler)", () => {
    it("returns 201 with the created account", async () => {
      mockSignUp.mockResolvedValue(accountResponse);

      await signUpHandler(createMockReq({ body: signUpBody }), res, next);

      expect(mockSignUp).toHaveBeenCalledWith(signUpBody);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(accountResponse);
    });

    it.each([
      [null, "Request body is required"],
      [{}, "email is required"],
      [{ email: "not-an-email", password: "secret" }, "email format is invalid"],
      [{ email: "User@Example.com", password: "secret" }, "email must be lowercase"],
      [{ email: "user@example.com" }, "password is required"],
      [{ email: "user@example.com", password: "" }, "password is required"],
    ])("returns 400 for invalid body %j", async (body, errorMessage) => {
      await signUpHandler(createMockReq({ body }), res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("returns 409 when the email is already registered", async () => {
      mockSignUp.mockRejectedValue(new ValidationError("email is already registered"));

      await signUpHandler(createMockReq({ body: signUpBody }), res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: "email is already registered" });
    });

    it("returns 503 when the service fails", async () => {
      mockSignUp.mockRejectedValue(
        new ServiceError("Unable to create account. Please try again later.")
      );

      await signUpHandler(createMockReq({ body: signUpBody }), res, next);

      expect(res.status).toHaveBeenCalledWith(503);
    });
  });
});
