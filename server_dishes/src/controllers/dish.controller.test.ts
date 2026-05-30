import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ServiceError } from "../errors";
import {
  createDishBody,
  dishResponse,
  editDishBody,
  updateDishBody,
} from "../test/fixtures/dish";
import { createMockNext, createMockReq, createMockRes } from "../test/helpers";
import {
  createDishHandler,
  deleteDishHandler,
  getDishByIdHandler,
  updateDishHandler,
} from "./dish.controller";
import * as dishService from "../services/dish.service";

vi.mock("../services/dish.service", () => ({
  createDish: vi.fn(),
  deleteDish: vi.fn(),
  getDishById: vi.fn(),
  updateDish: vi.fn(),
}));

const mockCreateDish = vi.mocked(dishService.createDish);
const mockDeleteDish = vi.mocked(dishService.deleteDish);
const mockGetDishById = vi.mocked(dishService.getDishById);
const mockUpdateDish = vi.mocked(dishService.updateDish);

const sharedInvalidIdCases = ["0", "-1", "abc", "1.5"] as const;

describe("Dish controller — CRUD", () => {
  const res = createMockRes();
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = createMockNext();
  });

  describe("CREATE (createDishHandler)", () => {
    it("returns 201 with the created dish", async () => {
      mockCreateDish.mockResolvedValue(dishResponse);

      await createDishHandler(createMockReq({ body: createDishBody }), res, next);

      expect(mockCreateDish).toHaveBeenCalledWith(createDishBody);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(dishResponse);
    });

    it.each([
      [null, "Request body is required"],
      [{}, "stallId must be a positive integer"],
      [{ stallId: 101, name: "A" }, "description is required"],
      [
        { stallId: 101, name: "A", description: "B", allergens: "gluten" },
        "allergens must be an array of strings",
      ],
    ])("returns 400 for invalid body %j", async (body, errorMessage) => {
      await createDishHandler(createMockReq({ body }), res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
      expect(mockCreateDish).not.toHaveBeenCalled();
    });

    it("returns 404 when the stall is not found", async () => {
      mockCreateDish.mockRejectedValue(new NotFoundError("Stall with id 999 was not found"));

      await createDishHandler(
        createMockReq({ body: { ...createDishBody, stallId: 999 } }),
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 503 when the service fails", async () => {
      mockCreateDish.mockRejectedValue(
        new ServiceError("Unable to create dish. Please try again later.")
      );

      await createDishHandler(createMockReq({ body: createDishBody }), res, next);

      expect(res.status).toHaveBeenCalledWith(503);
    });

    it("forwards unexpected errors to next", async () => {
      const err = new Error("unexpected");
      mockCreateDish.mockRejectedValue(err);

      await createDishHandler(createMockReq({ body: createDishBody }), res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("READ (getDishByIdHandler)", () => {
    it.each(sharedInvalidIdCases)("returns 400 for invalid id %s", async (id) => {
      await getDishByIdHandler(createMockReq({ params: { id } }), res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockGetDishById).not.toHaveBeenCalled();
    });

    it("returns 200 with the dish", async () => {
      mockGetDishById.mockResolvedValue(dishResponse);

      await getDishByIdHandler(createMockReq({ params: { id: "42" } }), res, next);

      expect(mockGetDishById).toHaveBeenCalledWith(42);
      expect(res.json).toHaveBeenCalledWith(dishResponse);
    });

    it("returns 404 when the dish is not found", async () => {
      mockGetDishById.mockRejectedValue(new NotFoundError("Dish with id 999 was not found"));

      await getDishByIdHandler(createMockReq({ params: { id: "999" } }), res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 503 when the service fails", async () => {
      mockGetDishById.mockRejectedValue(
        new ServiceError("Unable to load dish. Please try again later.")
      );

      await getDishByIdHandler(createMockReq({ params: { id: "42" } }), res, next);

      expect(res.status).toHaveBeenCalledWith(503);
    });

    it("forwards unexpected errors to next", async () => {
      const err = new Error("unexpected");
      mockGetDishById.mockRejectedValue(err);

      await getDishByIdHandler(createMockReq({ params: { id: "42" } }), res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("UPDATE (updateDishHandler)", () => {
    it.each(sharedInvalidIdCases)("returns 400 for invalid id %s", async (id) => {
      await updateDishHandler(
        createMockReq({ params: { id }, body: updateDishBody }),
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockUpdateDish).not.toHaveBeenCalled();
    });

    it("returns 200 with the updated dish", async () => {
      const updated = { ...dishResponse, name: "Updated Spring Rolls" };
      mockUpdateDish.mockResolvedValue(updated);

      await updateDishHandler(
        createMockReq({ params: { id: "42" }, body: updateDishBody }),
        res,
        next
      );

      expect(mockUpdateDish).toHaveBeenCalledWith(42, updateDishBody);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it("accepts body without stallId (edit form)", async () => {
      mockUpdateDish.mockResolvedValue(dishResponse);

      await updateDishHandler(
        createMockReq({ params: { id: "42" }, body: editDishBody }),
        res,
        next
      );

      expect(mockUpdateDish).toHaveBeenCalledWith(42, {
        ...editDishBody,
        category: undefined,
      });
    });

    it.each([
      [null, "Request body is required"],
      [{ name: "Only" }, "description is required"],
      [{ name: "A", description: "B", allergens: "soy" }, "allergens must be an array of strings"],
    ])("returns 400 for invalid body %j", async (body, errorMessage) => {
      await updateDishHandler(
        createMockReq({ params: { id: "42" }, body }),
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
      expect(mockUpdateDish).not.toHaveBeenCalled();
    });

    it("returns 404 when the dish is not found", async () => {
      mockUpdateDish.mockRejectedValue(new NotFoundError("Dish with id 999 was not found"));

      await updateDishHandler(
        createMockReq({ params: { id: "999" }, body: updateDishBody }),
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 503 when the service fails", async () => {
      mockUpdateDish.mockRejectedValue(
        new ServiceError("Unable to update dish. Please try again later.")
      );

      await updateDishHandler(
        createMockReq({ params: { id: "42" }, body: updateDishBody }),
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(503);
    });

    it("forwards unexpected errors to next", async () => {
      const err = new Error("unexpected");
      mockUpdateDish.mockRejectedValue(err);

      await updateDishHandler(
        createMockReq({ params: { id: "42" }, body: updateDishBody }),
        res,
        next
      );

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("DELETE (deleteDishHandler)", () => {
    it.each(sharedInvalidIdCases)("returns 400 for invalid id %s", async (id) => {
      await deleteDishHandler(createMockReq({ params: { id } }), res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockDeleteDish).not.toHaveBeenCalled();
    });

    it("returns 200 with the deleted dish", async () => {
      mockDeleteDish.mockResolvedValue(dishResponse);

      await deleteDishHandler(createMockReq({ params: { id: "42" } }), res, next);

      expect(mockDeleteDish).toHaveBeenCalledWith(42);
      expect(res.json).toHaveBeenCalledWith(dishResponse);
    });

    it("returns 404 when the dish is not found", async () => {
      mockDeleteDish.mockRejectedValue(new NotFoundError("Dish with id 999 was not found"));

      await deleteDishHandler(createMockReq({ params: { id: "999" } }), res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 503 when the service fails", async () => {
      mockDeleteDish.mockRejectedValue(
        new ServiceError("Unable to delete dish. Please try again later.")
      );

      await deleteDishHandler(createMockReq({ params: { id: "42" } }), res, next);

      expect(res.status).toHaveBeenCalledWith(503);
    });

    it("forwards unexpected errors to next", async () => {
      const err = new Error("unexpected");
      mockDeleteDish.mockRejectedValue(err);

      await deleteDishHandler(createMockReq({ params: { id: "42" } }), res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
