import { beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { signAccessToken, verifyAccessToken } from "./jwt";

describe("jwt", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.JWT_EXPIRES_IN = "1h";
  });

  it("signs and verifies a token with numeric sub", () => {
    const token = signAccessToken({ sub: 1, email: "user@example.com", isAdmin: true });
    const payload = verifyAccessToken(token);

    expect(payload).toEqual({
      sub: 1,
      email: "user@example.com",
      isAdmin: true,
    });
  });

  it("parses string sub from verified payload", () => {
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
    expect(() => signAccessToken({ sub: 1, email: "a@b.com" })).toThrow(
      "JWT_SECRET is not set"
    );
  });

  it("throws for invalid token", () => {
    expect(() => verifyAccessToken("not-a-token")).toThrow();
  });

  it("throws when email is missing from payload", () => {
    const token = jwt.sign({ sub: 1 }, process.env.JWT_SECRET!);
    expect(() => verifyAccessToken(token)).toThrow("Invalid token payload");
  });
});
