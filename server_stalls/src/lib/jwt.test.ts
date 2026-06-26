import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "./jwt";

describe("jwt", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  it("verifies a valid token", () => {
    const token = jwt.sign(
      { sub: 1, email: "admin@example.com", isAdmin: true },
      process.env.JWT_SECRET!
    );

    expect(verifyAccessToken(token)).toEqual({
      sub: 1,
      email: "admin@example.com",
      isAdmin: true,
    });
  });

  it("parses string subject ids", () => {
    const token = jwt.sign(
      { sub: "42", email: "user@example.com" },
      process.env.JWT_SECRET!
    );

    expect(verifyAccessToken(token)).toEqual({
      sub: 42,
      email: "user@example.com",
      isAdmin: false,
    });
  });

  it("throws when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;
    const token = jwt.sign({ sub: 1, email: "a@b.com" }, "other-secret");

    expect(() => verifyAccessToken(token)).toThrow();
  });

  it("throws for invalid payload", () => {
    const token = jwt.sign({ sub: 1 }, process.env.JWT_SECRET!);
    expect(() => verifyAccessToken(token)).toThrow("Invalid token payload");
  });

  it("throws for non-numeric subject", () => {
    const token = jwt.sign(
      { sub: "abc", email: "user@example.com" },
      process.env.JWT_SECRET!
    );
    expect(() => verifyAccessToken(token)).toThrow("Invalid token payload");
  });
});
