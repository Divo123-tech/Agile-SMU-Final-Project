import { beforeEach, describe, expect, it, vi } from "vitest";
import { pool } from "../db";
import { dishRow, dishResponse } from "../test/fixtures/dish";
import { createDish, deleteDish, getDishById, updateDish } from "./dish.service";

vi.mock("../db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

const mockQuery = vi.mocked(pool.query);

function mockStallExists(exists: boolean): void {
  mockQuery.mockResolvedValueOnce({
    rows: exists ? [{ id: dishRow.stall_id }] : [],
  } as never);
}

describe("Dish service — CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("READ (getDishById)", () => {
    it("returns a dish by id", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [dishRow] } as never);

      const result = await getDishById(42);

      expect(result).toEqual(dishResponse);
      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT * FROM dishes WHERE dish_id = $1 LIMIT 1",
        [42]
      );
    });

    it("maps null description and allergens to empty values", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...dishRow, description: null, allergens: null, category: null }],
      } as never);

      const result = await getDishById(42);

      expect(result.description).toBe("");
      expect(result.allergens).toEqual([]);
      expect(result.category).toBe("Other");
    });

    it("throws NotFoundError when the dish does not exist", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);

      await expect(getDishById(999)).rejects.toMatchObject({
        name: "NotFoundError",
        message: "Dish with id 999 was not found",
      });
    });

    it("throws ServiceError when the query fails", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockQuery.mockRejectedValueOnce(new Error("connection refused"));

      await expect(getDishById(42)).rejects.toMatchObject({
        name: "ServiceError",
        message: "Unable to load dish. Please try again later.",
      });

      consoleSpy.mockRestore();
    });
  });

  describe("CREATE (createDish)", () => {
    it("inserts a dish and returns the created record", async () => {
      mockStallExists(true);
      mockQuery.mockResolvedValueOnce({ rows: [dishRow] } as never);

      const result = await createDish({
        stallId: 101,
        name: "Crispy Spring Rolls",
        description: "Served with sweet chili sauce",
        allergens: ["gluten", "soy"],
        category: "Appetizers",
      });

      expect(result).toEqual(dishResponse);
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("INSERT INTO dishes"),
        [101, "Crispy Spring Rolls", "Served with sweet chili sauce", "gluten, soy", "Appetizers"]
      );
    });

    it("defaults category to Other and stores null allergens when none provided", async () => {
      mockStallExists(true);
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...dishRow, allergens: null, category: "Other" }],
      } as never);

      const result = await createDish({
        stallId: 101,
        name: "Edamame",
        description: "Steamed soybeans with sea salt",
        allergens: [],
      });

      expect(result.category).toBe("Other");
      expect(result.allergens).toEqual([]);
    });

    it("does not insert when the stall does not exist", async () => {
      mockStallExists(false);

      await expect(
        createDish({
          stallId: 999,
          name: "Test Dish",
          description: "Test",
          allergens: [],
        })
      ).rejects.toMatchObject({
        name: "NotFoundError",
        message: "Stall with id 999 was not found",
      });

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it("throws ServiceError when the insert fails", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockStallExists(true);
      mockQuery.mockRejectedValueOnce(new Error("connection refused"));

      await expect(
        createDish({
          stallId: 101,
          name: "Test Dish",
          description: "Test",
          allergens: [],
        })
      ).rejects.toMatchObject({
        name: "ServiceError",
        message: "Unable to create dish. Please try again later.",
      });

      consoleSpy.mockRestore();
    });
  });

  describe("UPDATE (updateDish)", () => {
    it("updates a dish and returns the updated record", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [dishRow] } as never)
        .mockResolvedValueOnce({
          rows: [
            {
              ...dishRow,
              dish_name: "Updated Spring Rolls",
              description: "New description",
              allergens: "soy",
              category: "Sides",
            },
          ],
        } as never);

      const result = await updateDish(42, {
        name: "Updated Spring Rolls",
        description: "New description",
        allergens: ["soy"],
        category: "Sides",
      });

      expect(result.name).toBe("Updated Spring Rolls");
      expect(result.category).toBe("Sides");
    });

    it("keeps stall and category when not provided", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [dishRow] } as never)
        .mockResolvedValueOnce({
          rows: [{ ...dishRow, dish_name: "Renamed", description: "New desc" }],
        } as never);

      await updateDish(42, {
        name: "Renamed",
        description: "New desc",
        allergens: [],
      });

      expect(mockQuery).toHaveBeenLastCalledWith(
        expect.stringContaining("UPDATE dishes"),
        [101, "Renamed", "New desc", null, "Appetizers", 42]
      );
    });

    it("throws NotFoundError when changing to a non-existent stall", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [dishRow] } as never)
        .mockResolvedValueOnce({ rows: [] } as never);

      await expect(
        updateDish(42, {
          stallId: 999,
          name: "Test",
          description: "Test",
          allergens: [],
        })
      ).rejects.toMatchObject({
        name: "NotFoundError",
        message: "Stall with id 999 was not found",
      });
    });

    it("throws NotFoundError when the dish does not exist", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);

      await expect(
        updateDish(999, {
          name: "Test",
          description: "Test",
          allergens: [],
        })
      ).rejects.toMatchObject({
        name: "NotFoundError",
        message: "Dish with id 999 was not found",
      });
    });

    it("throws ServiceError when the update fails", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockQuery
        .mockResolvedValueOnce({ rows: [dishRow] } as never)
        .mockRejectedValueOnce(new Error("connection refused"));

      await expect(
        updateDish(42, {
          name: "Test",
          description: "Test",
          allergens: [],
        })
      ).rejects.toMatchObject({
        name: "ServiceError",
        message: "Unable to update dish. Please try again later.",
      });

      consoleSpy.mockRestore();
    });
  });

  describe("DELETE (deleteDish)", () => {
    it("deletes a dish and returns the removed record", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [dishRow] } as never);

      const result = await deleteDish(42);

      expect(result).toEqual(dishResponse);
      expect(mockQuery).toHaveBeenCalledWith(
        "DELETE FROM dishes WHERE dish_id = $1 RETURNING *",
        [42]
      );
    });

    it("throws NotFoundError when the dish does not exist", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);

      await expect(deleteDish(999)).rejects.toMatchObject({
        name: "NotFoundError",
        message: "Dish with id 999 was not found",
      });
    });

    it("throws ServiceError when the delete fails", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockQuery.mockRejectedValueOnce(new Error("connection refused"));

      await expect(deleteDish(42)).rejects.toMatchObject({
        name: "ServiceError",
        message: "Unable to delete dish. Please try again later.",
      });

      consoleSpy.mockRestore();
    });
  });
});
