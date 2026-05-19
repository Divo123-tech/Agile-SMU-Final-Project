import { beforeEach, describe, expect, it, vi } from "vitest";
import { pool } from "../db";
import { NotFoundError, ServiceError } from "../errors";
import { getStallMenu } from "./stall.service";

vi.mock("../db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

const mockQuery = vi.mocked(pool.query);

const sampleStallRow = {
  id: 101,
  name: "The Golden Wok",
  description: "Authentic Asian street food",
  image_url: "https://example.com/stall.jpg",
  address: "Food Court Level 2",
};

const padThaiRow = {
  dish_id: 1,
  stall_id: 101,
  dish_name: "Classic Pad Thai with Shrimp",
  description: "Traditional stir-fried noodles",
  allergens: "peanuts, soy, shrimp",
  category: "Main Course",
};

const springRollRow = {
  dish_id: 2,
  stall_id: 101,
  dish_name: "Crispy Spring Rolls",
  description: "Served with sweet chili sauce",
  allergens: "gluten, soy",
  category: "Appetizers",
};

const uncategorizedRow = {
  dish_id: 3,
  stall_id: 101,
  dish_name: "Mystery Bowl",
  description: null,
  allergens: null,
  category: null,
};

function mockQueries(stallRows: unknown[], dishRows: unknown[]): void {
  mockQuery
    .mockResolvedValueOnce({ rows: stallRows } as never)
    .mockResolvedValueOnce({ rows: dishRows } as never);
}

describe("getStallMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns stall info and dishes grouped by category", async () => {
    mockQueries([sampleStallRow], [padThaiRow, springRollRow]);

    const result = await getStallMenu(101);

    expect(result.stall).toEqual({
      name: "The Golden Wok",
      description: "Authentic Asian street food",
      image: "https://example.com/stall.jpg",
      address: "Food Court Level 2",
    });
    expect(result.categories).toHaveLength(2);
    expect(result.categories[0]).toEqual({
      category: "Appetizers",
      dishes: [
        {
          id: "2",
          name: "Crispy Spring Rolls",
          description: "Served with sweet chili sauce",
          allergens: ["gluten", "soy"],
        },
      ],
    });
    expect(result.categories[1]).toEqual({
      category: "Main Course",
      dishes: [
        {
          id: "1",
          name: "Classic Pad Thai with Shrimp",
          description: "Traditional stir-fried noodles",
          allergens: ["peanuts", "soy", "shrimp"],
        },
      ],
    });
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT * FROM stalls WHERE id = $1 LIMIT 1",
      [101]
    );
    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT * FROM dishes WHERE stall_id = $1",
      [101]
    );
  });

  it("places dishes without a category under Other", async () => {
    mockQueries([sampleStallRow], [uncategorizedRow]);

    const result = await getStallMenu(101);

    expect(result.categories).toEqual([
      {
        category: "Other",
        dishes: [
          {
            id: "3",
            name: "Mystery Bowl",
            description: "",
            allergens: [],
          },
        ],
      },
    ]);
  });

  it("throws NotFoundError when the stall row is missing", async () => {
    mockQueries([], [padThaiRow]);

    await expect(getStallMenu(999)).rejects.toMatchObject({
      name: "NotFoundError",
      message: "Stall with id 999 was not found",
    });
  });

  it("throws NotFoundError when the stall has no usable name", async () => {
    mockQueries([{ id: 101, name: "   ", description: null }], []);

    await expect(getStallMenu(101)).rejects.toThrow(NotFoundError);
  });

  it("throws ServiceError when the database query fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("connection refused"));

    await expect(getStallMenu(101)).rejects.toMatchObject({
      name: "ServiceError",
      message: "Unable to load stall menu. Please try again later.",
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
