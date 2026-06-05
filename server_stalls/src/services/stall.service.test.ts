import { beforeEach, describe, expect, it, vi } from "vitest";
import { pool } from "../db";
import { createStallInput, myStallsResponse, stallResponse } from "../test/fixtures/stall";
import { createStall, getMyStalls } from "./stall.service";

vi.mock("../db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock("../lib/s3", () => ({
  resolveImageUrlForClient: vi.fn((url: string) => Promise.resolve(url)),
}));

const mockQuery = vi.mocked(pool.query);

describe("Stall service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createStall", () => {
    it("inserts a stall and returns the created record", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: createStallInput.name,
            owner: createStallInput.owner,
            description: createStallInput.description,
            address: createStallInput.address,
            image_url: createStallInput.imageUrl,
            proof_of_ownership_url: createStallInput.proofOfOwnershipUrl,
            status: "pending",
            admin_notes: null,
            updated_at: stallResponse.updatedAt,
          },
        ],
      } as never);

      const result = await createStall(createStallInput);

      expect(result).toEqual(stallResponse);
    });
  });

  describe("getMyStalls", () => {
    it("returns all stalls for the given owner", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: stallResponse.name,
            owner: 42,
            description: stallResponse.description,
            address: stallResponse.address,
            image_url: stallResponse.image,
            proof_of_ownership_url: stallResponse.proofOfOwnership,
            status: stallResponse.status,
            admin_notes: null,
            updated_at: stallResponse.updatedAt,
          },
        ],
      } as never);

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
  });
});
