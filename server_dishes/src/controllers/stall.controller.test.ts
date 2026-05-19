import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ServiceError } from "../errors";
import { getStallById } from "./stall.controller";
import * as stallService from "../services/stall.service";

vi.mock("../services/stall.service", () => ({
  getStallMenu: vi.fn(),
}));

const mockGetStallMenu = vi.mocked(stallService.getStallMenu);

function createMockRes(): Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
} {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

function createReq(id: string): Request {
  return { params: { id } } as Request;
}

describe("getStallById", () => {
  let res: ReturnType<typeof createMockRes>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    res = createMockRes();
    next = vi.fn();
  });

  it.each(["0", "-1", "abc", "1.5"])(
    "returns 400 for invalid stall id %s",
    async (id) => {
      await getStallById(createReq(id), res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "stall id must be a positive integer",
      });
      expect(mockGetStallMenu).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    }
  );

  it("returns 200 with the stall menu on success", async () => {
    const menu = {
      stall: {
        name: "The Golden Wok",
        description: "Authentic Asian street food",
        image: "https://example.com/stall.jpg",
        address: "Food Court Level 2",
      },
      categories: [
        {
          category: "Main Course",
          dishes: [
            {
              id: "1",
              name: "Classic Pad Thai",
              description: "Noodles",
              allergens: ["peanuts"],
            },
          ],
        },
      ],
    };
    mockGetStallMenu.mockResolvedValue(menu);

    await getStallById(createReq("101"), res, next);

    expect(mockGetStallMenu).toHaveBeenCalledWith(101);
    expect(res.json).toHaveBeenCalledWith(menu);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 404 when the stall is not found", async () => {
    mockGetStallMenu.mockRejectedValue(new NotFoundError("Stall with id 999 was not found"));

    await getStallById(createReq("999"), res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Stall with id 999 was not found",
      stall: null,
      categories: [],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 503 when the service fails", async () => {
    mockGetStallMenu.mockRejectedValue(
      new ServiceError("Unable to load stall menu. Please try again later.")
    );

    await getStallById(createReq("101"), res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unable to load stall menu. Please try again later.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards unexpected errors to next", async () => {
    const err = new Error("unexpected");
    mockGetStallMenu.mockRejectedValue(err);

    await getStallById(createReq("101"), res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
