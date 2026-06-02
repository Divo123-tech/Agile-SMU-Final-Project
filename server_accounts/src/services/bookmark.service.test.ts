import { beforeEach, describe, expect, it, vi } from "vitest";
import { pool } from "../db";
import { NotFoundError, ValidationError } from "../errors";
import {
  addBookmark,
  listBookmarkedDishes,
  removeBookmark,
} from "./bookmark.service";

vi.mock("../db", () => ({
  pool: { query: vi.fn() },
}));

const mockQuery = vi.mocked(pool.query);

describe("Bookmark service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listBookmarkedDishes", () => {
    it("returns stalls and dishes", async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            dish_id: 1,
            stall_id: 10,
            dish_name: "Laksa",
            description: "Spicy",
            allergens: "shellfish",
            category: "Mains",
            stall_name: "Stall A",
            created_at: new Date("2026-01-01T00:00:00.000Z"),
          },
        ],
        rowCount: 1,
      } as never);

      const result = await listBookmarkedDishes(5);

      expect(result.stalls).toEqual([{ id: 10, name: "Stall A" }]);
      expect(result.dishes).toHaveLength(1);
      expect(result.dishes[0].id).toBe("1");
      expect(result.dishes[0].allergens).toEqual(["shellfish"]);
    });
  });

  describe("addBookmark", () => {
    it("throws when dish does not exist", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

      await expect(addBookmark(5, 99)).rejects.toThrow(NotFoundError);
    });

    it("throws for invalid dish id", async () => {
      await expect(addBookmark(5, 0)).rejects.toThrow(ValidationError);
    });
  });

  describe("removeBookmark", () => {
    it("throws when bookmark is missing", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 } as never);

      await expect(removeBookmark(5, 1)).rejects.toThrow(NotFoundError);
    });
  });
});
