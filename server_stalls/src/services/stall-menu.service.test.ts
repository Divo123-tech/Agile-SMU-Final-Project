import { beforeEach, describe, expect, it, vi } from "vitest";
import { pool } from "../db";
import { NotFoundError } from "../errors";
import { getStallMenu } from "./stall-menu.service";

vi.mock("../db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock("../lib/s3", () => ({
  resolveImageUrlForClient: vi.fn((url: string) => Promise.resolve(url)),
}));

const mockQuery = vi.mocked(pool.query);

const sampleStallRow = {
  id: 101,
  name: "The Golden Wok",
  owner: 42,
  description: "Authentic Asian street food",
  image_url: "https://example.com/stall.jpg",
  address: "Food Court Level 2",
  proof_of_ownership_url: "https://example.com/proof.pdf",
  updated_at: "2026-05-23T10:00:00.000Z",
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
      owner: 42,
      updatedAt: "2026-05-23T10:00:00.000Z",
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
    expect(mockQuery).toHaveBeenCalledTimes(2);
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
    mockQueries(
      [
        {
          id: 101,
          name: "   ",
          owner: 42,
          description: null,
          address: null,
          image_url: null,
          proof_of_ownership_url: null,
        },
      ],
      []
    );

    await expect(getStallMenu(101)).rejects.toThrow(NotFoundError);
  });

  it("throws ServiceError when the database query fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("connection refused"));

    await expect(getStallMenu(101)).rejects.toMatchObject({
      name: "ServiceError",
      message: "Unable to load stall menu. Please try again later.",
    });

    consoleSpy.mockRestore();
  });
});
