import { beforeEach, describe, expect, it, vi } from "vitest";
import { pool } from "../db";
import { NotFoundError, ServiceError, ValidationError } from "../errors";
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

    it("returns empty lists when user has no bookmarks", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as never);

      const result = await listBookmarkedDishes(5);

      expect(result).toEqual({ dishes: [], stalls: [] });
    });

    it("wraps database errors", async () => {
      mockQuery.mockRejectedValue(new Error("db"));

      await expect(listBookmarkedDishes(5)).rejects.toBeInstanceOf(ServiceError);
    });
  });

  describe("addBookmark", () => {
    it("creates a bookmark", async () => {
      const row = {
        dish_id: 1,
        stall_id: 10,
        dish_name: "Laksa",
        description: "Spicy",
        allergens: "shellfish",
        category: "Mains",
        stall_name: "Stall A",
        created_at: new Date("2026-01-01T00:00:00.000Z"),
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ dish_id: 1 }], rowCount: 1 } as never)
        .mockResolvedValueOnce({ rowCount: 1 } as never)
        .mockResolvedValueOnce({ rows: [row], rowCount: 1 } as never);

      const result = await addBookmark(5, 1);

      expect(result.id).toBe("1");
      expect(result.stallName).toBe("Stall A");
    });

    it("throws when dish does not exist", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

      await expect(addBookmark(5, 99)).rejects.toThrow(NotFoundError);
    });

    it("throws for invalid dish id", async () => {
      await expect(addBookmark(5, 0)).rejects.toThrow(ValidationError);
    });

    it("wraps database errors", async () => {
      mockQuery.mockRejectedValue(new Error("db"));

      await expect(addBookmark(5, 1)).rejects.toBeInstanceOf(ServiceError);
    });
  });

  describe("removeBookmark", () => {
    it("removes an existing bookmark", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 } as never);

      await expect(removeBookmark(5, 1)).resolves.toBeUndefined();
    });

    it("throws when bookmark is missing", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 } as never);

      await expect(removeBookmark(5, 1)).rejects.toThrow(NotFoundError);
    });

    it("wraps database errors", async () => {
      mockQuery.mockRejectedValue(new Error("db"));

      await expect(removeBookmark(5, 1)).rejects.toBeInstanceOf(ServiceError);
    });
  });
});
