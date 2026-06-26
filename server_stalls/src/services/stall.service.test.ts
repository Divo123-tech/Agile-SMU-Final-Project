import { beforeEach, describe, expect, it, vi } from "vitest";
import { pool } from "../db";
import { NotFoundError, ServiceError } from "../errors";
import {
  createStallInput,
  myStallsResponse,
  stallResponse,
  updateStallBody,
} from "../test/fixtures/stall";
import {
  createStall,
  deleteStall,
  getMyStalls,
  getSignedStallMediaUrl,
  getStallById,
  getStalls,
  updateStall,
} from "./stall.service";

vi.mock("../db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock("../lib/s3", () => ({
  resolveImageUrlForClient: vi.fn((url: string) => Promise.resolve(url)),
  resolveStallFileUrlForClient: vi.fn((url: string) => Promise.resolve(url || "")),
}));

const mockQuery = vi.mocked(pool.query);

const stallRow = {
  id: 1,
  name: stallResponse.name,
  owner: stallResponse.owner,
  description: stallResponse.description,
  address: stallResponse.address,
  image_url: createStallInput.imageUrl,
  proof_of_ownership_url: createStallInput.proofOfOwnershipUrl,
  status: stallResponse.status,
  admin_notes: null,
  updated_at: stallResponse.updatedAt,
};

describe("Stall service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createStall", () => {
    it("inserts a stall and returns the created record", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [stallRow] } as never);

      const result = await createStall(createStallInput);

      expect(result).toEqual(stallResponse);
    });

    it("wraps database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db"));

      await expect(createStall(createStallInput)).rejects.toBeInstanceOf(ServiceError);
    });
  });

  describe("getStallById", () => {
    it("returns a stall", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [stallRow] } as never);

      const result = await getStallById(1);

      expect(result.id).toBe(1);
    });

    it("throws NotFoundError when missing", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);

      await expect(getStallById(99)).rejects.toBeInstanceOf(NotFoundError);
    });

    it("wraps unexpected errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db"));

      await expect(getStallById(1)).rejects.toBeInstanceOf(ServiceError);
    });
  });

  describe("updateStall", () => {
    it("updates an existing stall", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [stallRow] } as never)
        .mockResolvedValueOnce({ rows: [{ ...stallRow, ...updateStallBody }] } as never);

      const result = await updateStall(1, updateStallBody);

      expect(result.name).toBe(updateStallBody.name);
    });

    it("throws NotFoundError when stall is missing", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);

      await expect(updateStall(99, updateStallBody)).rejects.toBeInstanceOf(NotFoundError);
    });

    it("wraps unexpected errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db"));

      await expect(updateStall(1, updateStallBody)).rejects.toBeInstanceOf(ServiceError);
    });
  });

  describe("deleteStall", () => {
    it("deletes stall and related dishes", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [stallRow] } as never)
        .mockResolvedValueOnce({ rows: [] } as never)
        .mockResolvedValueOnce({ rows: [stallRow] } as never);

      const result = await deleteStall(1);

      expect(result.id).toBe(1);
      expect(mockQuery).toHaveBeenCalledWith(
        "DELETE FROM dishes WHERE stall_id = $1",
        [1]
      );
    });

    it("throws NotFoundError when stall is missing", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);

      await expect(deleteStall(99)).rejects.toBeInstanceOf(NotFoundError);
    });

    it("wraps unexpected errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db"));

      await expect(deleteStall(1)).rejects.toBeInstanceOf(ServiceError);
    });
  });

  describe("getMyStalls", () => {
    it("returns all stalls for the given owner", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [stallRow] } as never);

      const result = await getMyStalls(42);

      expect(result).toEqual(myStallsResponse);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE owner = $1"),
        [42]
      );
    });

    it("returns an empty list when the user has no stalls", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);

      const result = await getMyStalls(99);

      expect(result).toEqual({ userId: 99, count: 0, stalls: [] });
    });

    it("wraps database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db"));

      await expect(getMyStalls(1)).rejects.toBeInstanceOf(ServiceError);
    });
  });

  describe("getStalls", () => {
    it("returns approved stalls only", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...stallRow, status: "approved" }],
      } as never);

      const result = await getStalls();

      expect(result.count).toBe(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("status = 'approved'"));
    });

    it("wraps database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db"));

      await expect(getStalls()).rejects.toBeInstanceOf(ServiceError);
    });
  });

  describe("getSignedStallMediaUrl", () => {
    it("returns signed image URL", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ image_url: stallRow.image_url, proof_of_ownership_url: "" }],
      } as never);

      const result = await getSignedStallMediaUrl(1, "image");

      expect(result).toBe(stallRow.image_url);
    });

    it("throws when stall has no photo", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ image_url: "", proof_of_ownership_url: "" }],
      } as never);

      await expect(getSignedStallMediaUrl(1, "image")).rejects.toBeInstanceOf(
        NotFoundError
      );
    });

    it("throws when stall is missing", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);

      await expect(getSignedStallMediaUrl(99, "proof")).rejects.toBeInstanceOf(
        NotFoundError
      );
    });

    it("returns signed proof URL", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ image_url: "", proof_of_ownership_url: "https://example.com/proof.pdf" }],
      } as never);

      const result = await getSignedStallMediaUrl(1, "proof");

      expect(result).toBe("https://example.com/proof.pdf");
    });
  });
});
