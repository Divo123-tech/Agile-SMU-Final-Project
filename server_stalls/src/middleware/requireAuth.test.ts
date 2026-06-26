import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";
import jwt from "jsonwebtoken";
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
    return { headers: header ? { authorization: header } : {} } as Request;
  }

  it("returns 401 without bearer token", () => {
    requireAuth(reqWithAuth(), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 for invalid token", () => {
    requireAuth(reqWithAuth("Bearer bad-token"), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 for non-bearer header", () => {
    requireAuth(reqWithAuth("Token abc"), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 for empty bearer token", () => {
    requireAuth(reqWithAuth("Bearer "), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("accepts valid token", () => {
    const token = jwt.sign({ sub: 2, email: "user@example.com" }, process.env.JWT_SECRET!);
    const req = reqWithAuth(`Bearer ${token}`);
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
