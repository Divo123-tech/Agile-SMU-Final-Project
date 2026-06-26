import { beforeEach, describe, expect, it, vi } from "vitest";
import { pool } from "../db";
import { ForbiddenError } from "../errors";
import { createMockNext, createMockRes } from "../test/helpers";
import { requireAdmin } from "./requireAdmin";

vi.mock("../db", () => ({
  pool: { query: vi.fn() },
}));

const mockQuery = vi.mocked(pool.query);

describe("requireAdmin", () => {
  const res = createMockRes();
  let next: ReturnType<typeof createMockNext>;
  const authReq = { accountId: 1 } as { accountId: number };

  beforeEach(() => {
    vi.clearAllMocks();
    next = createMockNext();
  });

  it("returns 403 when account is not admin", async () => {
    mockQuery.mockResolvedValue({ rows: [{ is_admin: false }] } as never);

    await requireAdmin(authReq as never, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 403 when account is missing", async () => {
    mockQuery.mockResolvedValue({ rows: [] } as never);

    await requireAdmin(authReq as never, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("calls next for admin account", async () => {
    mockQuery.mockResolvedValue({ rows: [{ is_admin: true }] } as never);

    await requireAdmin(authReq as never, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("returns 503 when database fails", async () => {
    mockQuery.mockRejectedValue(new Error("db down"));

    await requireAdmin(authReq as never, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
  });

  it("returns 403 when ForbiddenError is thrown", async () => {
    mockQuery.mockRejectedValue(new ForbiddenError("Custom forbidden"));

    await requireAdmin(authReq as never, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Custom forbidden" });
  });
});
