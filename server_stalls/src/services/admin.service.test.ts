import { beforeEach, describe, expect, it, vi } from "vitest";
import { pool } from "../db";
import { NotFoundError, ServiceError, ValidationError } from "../errors";
import {
  getAdminStallById,
  listPendingStalls,
  setStallStatus,
} from "./admin.service";
import { stallResponse } from "../test/fixtures/stall";

vi.mock("../db", () => ({
  pool: { query: vi.fn() },
}));

vi.mock("../lib/s3", () => ({
  resolveImageUrlForClient: vi.fn((url: string) => Promise.resolve(url)),
  resolveStallFileUrlForClient: vi.fn((url: string) => Promise.resolve(url)),
}));

const mockQuery = vi.mocked(pool.query);

const stallRow = {
  id: 1,
  name: stallResponse.name,
  owner: stallResponse.owner,
  description: stallResponse.description,
  address: stallResponse.address,
  image_url: "https://example.com/photo.jpg",
  proof_of_ownership_url: "https://example.com/proof.pdf",
  status: "pending" as const,
  admin_notes: null,
  updated_at: stallResponse.updatedAt,
  owner_email: "owner@example.com",
};

describe("admin.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listPendingStalls returns pending stalls", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [stallRow] } as never);

    const result = await listPendingStalls();

    expect(result.count).toBe(1);
    expect(result.stalls[0].ownerEmail).toBe("owner@example.com");
  });

  it("listPendingStalls wraps database errors", async () => {
    mockQuery.mockRejectedValueOnce(new Error("db"));

    await expect(listPendingStalls()).rejects.toBeInstanceOf(ServiceError);
  });

  it("getAdminStallById returns stall", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [stallRow] } as never);

    const result = await getAdminStallById(1);

    expect(result.id).toBe(1);
  });

  it("getAdminStallById throws NotFoundError", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);

    await expect(getAdminStallById(99)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("setStallStatus approves pending stall", async () => {
    mockQuery
      .mockResolvedValueOnce({ rowCount: 1 } as never)
      .mockResolvedValueOnce({ rows: [{ ...stallRow, status: "approved" }] } as never);

    const result = await setStallStatus(1, "approved");

    expect(result.status).toBe("approved");
  });

  it("setStallStatus requires notes when rejecting", async () => {
    await expect(setStallStatus(1, "rejected")).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  it("setStallStatus rejects invalid status", async () => {
    await expect(setStallStatus(1, "pending" as never)).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  it("setStallStatus throws when pending stall not found", async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 0 } as never);

    await expect(
      setStallStatus(1, "rejected", "Missing documents")
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("getAdminStallById wraps database errors", async () => {
    mockQuery.mockRejectedValueOnce(new Error("db"));

    await expect(getAdminStallById(1)).rejects.toBeInstanceOf(ServiceError);
  });

  it("setStallStatus wraps database errors", async () => {
    mockQuery.mockRejectedValueOnce(new Error("db"));

    await expect(setStallStatus(1, "approved")).rejects.toBeInstanceOf(ServiceError);
  });
});
