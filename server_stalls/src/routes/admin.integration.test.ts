process.env.JWT_SECRET = "test-jwt-secret";

import request from "supertest";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { stallResponse } from "../test/fixtures/stall";
import * as adminService from "../services/admin.service";

vi.mock("../db", () => ({
  pool: { query: vi.fn() },
}));

vi.mock("../services/admin.service", () => ({
  listPendingStalls: vi.fn(),
  getAdminStallById: vi.fn(),
  setStallStatus: vi.fn(),
}));

vi.mock("../services/stall-menu.service", () => ({
  getAdminStallMenu: vi.fn(),
  getStallMenu: vi.fn(),
}));

import { pool } from "../db";
import app from "../app";

const mockPoolQuery = vi.mocked(pool.query);
const mockList = vi.mocked(adminService.listPendingStalls);

describe("Admin API", () => {
  const adminToken = jwt.sign(
    { sub: 1, email: "admin@example.com", isAdmin: true },
    process.env.JWT_SECRET!
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mockPoolQuery.mockResolvedValue({ rows: [{ is_admin: true }] } as never);
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/admin/stalls/pending");
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [{ is_admin: false }] } as never);

    const res = await request(app)
      .get("/admin/stalls/pending")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
  });

  it("returns pending stalls for admin", async () => {
    mockList.mockResolvedValue({ count: 1, stalls: [stallResponse as never] });

    const res = await request(app)
      .get("/admin/stalls/pending")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });
});
