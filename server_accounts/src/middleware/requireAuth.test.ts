import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";
import { signAccessToken } from "../lib/jwt";
import { createMockNext, createMockRes } from "../test/helpers";
import { requireAuth } from "./requireAuth";

describe("requireAuth", () => {
  const res = createMockRes();
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-jwt-secret";
    next = createMockNext();
  });

  function reqWithAuth(header?: string): Request {
    return {
      headers: header ? { authorization: header } : {},
    } as Request;
  }

  it("returns 401 when authorization header is missing", () => {
    requireAuth(reqWithAuth(), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for empty bearer token", () => {
    requireAuth(reqWithAuth("Bearer "), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for invalid token", () => {
    requireAuth(reqWithAuth("Bearer bad-token"), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired token" });
  });

  it("calls next and sets account fields for valid token", () => {
    const token = signAccessToken({ sub: 7, email: "user@example.com" });
    const req = reqWithAuth(`Bearer ${token}`);

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as { accountId?: number }).accountId).toBe(7);
    expect((req as { accountEmail?: string }).accountEmail).toBe("user@example.com");
  });
});
