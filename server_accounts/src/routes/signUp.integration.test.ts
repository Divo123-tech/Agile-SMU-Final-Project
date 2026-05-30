import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceError, ValidationError } from "../errors";
import * as signUpService from "../services/signUp.service";
import { accountResponse, signUpBody } from "../test/fixtures/account";

vi.mock("../services/signUp.service", () => ({
  signUp: vi.fn(),
}));

import app from "../app";

const mockSignUp = vi.mocked(signUpService.signUp);

describe("Sign-up API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /sign-up", () => {
    it("returns 201 and the created account", async () => {
      mockSignUp.mockResolvedValue(accountResponse);

      const res = await request(app).post("/sign-up").send(signUpBody);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(accountResponse);
      expect(mockSignUp).toHaveBeenCalledWith(signUpBody);
    });

    it("returns 400 when the body is invalid", async () => {
      const res = await request(app)
        .post("/sign-up")
        .send({ email: "user@example.com" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "password is required" });
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("returns 409 when the email is already registered", async () => {
      mockSignUp.mockRejectedValue(new ValidationError("email is already registered"));

      const res = await request(app).post("/sign-up").send(signUpBody);

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: "email is already registered" });
    });

    it("returns 503 when the service fails", async () => {
      mockSignUp.mockRejectedValue(
        new ServiceError("Unable to create account. Please try again later.")
      );

      const res = await request(app).post("/sign-up").send(signUpBody);

      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        error: "Unable to create account. Please try again later.",
      });
    });
  });
});
