import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ServiceError } from "../errors";
import * as dishService from "../services/dish.service";
import {
  createDishBody,
  dishResponse,
  editDishBody,
  updateDishBody,
} from "../test/fixtures/dish";

vi.mock("../services/dish.service", () => ({
  createDish: vi.fn(),
  getDishById: vi.fn(),
  updateDish: vi.fn(),
  deleteDish: vi.fn(),
}));

import app from "../app";

const mockCreateDish = vi.mocked(dishService.createDish);
const mockGetDishById = vi.mocked(dishService.getDishById);
const mockUpdateDish = vi.mocked(dishService.updateDish);
const mockDeleteDish = vi.mocked(dishService.deleteDish);

describe("Dish CRUD API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CREATE — POST /dishes", () => {
    it("returns 201 and the created dish", async () => {
      mockCreateDish.mockResolvedValue(dishResponse);

      const res = await request(app).post("/dishes").send(createDishBody);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(dishResponse);
      expect(mockCreateDish).toHaveBeenCalledWith(createDishBody);
    });

    it("returns 400 when the body is invalid", async () => {
      const res = await request(app)
        .post("/dishes")
        .send({ stallId: 101, name: "Only name" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "description is required" });
      expect(mockCreateDish).not.toHaveBeenCalled();
    });

    it("returns 404 when the stall does not exist", async () => {
      mockCreateDish.mockRejectedValue(new NotFoundError("Stall with id 999 was not found"));

      const res = await request(app)
        .post("/dishes")
        .send({ ...createDishBody, stallId: 999 });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Stall with id 999 was not found" });
    });

    it("returns 503 when the service fails", async () => {
      mockCreateDish.mockRejectedValue(
        new ServiceError("Unable to create dish. Please try again later.")
      );

      const res = await request(app).post("/dishes").send(createDishBody);

      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        error: "Unable to create dish. Please try again later.",
      });
    });
  });

  describe("READ — GET /dishes/:id", () => {
    it("returns 200 and the dish", async () => {
      mockGetDishById.mockResolvedValue(dishResponse);

      const res = await request(app).get("/dishes/42");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(dishResponse);
      expect(mockGetDishById).toHaveBeenCalledWith(42);
    });

    it("returns 400 for an invalid id", async () => {
      const res = await request(app).get("/dishes/abc");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "dish id must be a positive integer" });
      expect(mockGetDishById).not.toHaveBeenCalled();
    });

    it("returns 404 when the dish does not exist", async () => {
      mockGetDishById.mockRejectedValue(new NotFoundError("Dish with id 999 was not found"));

      const res = await request(app).get("/dishes/999");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Dish with id 999 was not found" });
    });

    it("returns 503 when the service fails", async () => {
      mockGetDishById.mockRejectedValue(
        new ServiceError("Unable to load dish. Please try again later.")
      );

      const res = await request(app).get("/dishes/42");

      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        error: "Unable to load dish. Please try again later.",
      });
    });
  });

  describe("UPDATE — PUT /dishes/:id", () => {
    it("returns 200 and the updated dish", async () => {
      const updated = { ...dishResponse, ...updateDishBody, allergens: ["soy"] };
      mockUpdateDish.mockResolvedValue(updated);

      const res = await request(app).put("/dishes/42").send(updateDishBody);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updated);
      expect(mockUpdateDish).toHaveBeenCalledWith(42, updateDishBody);
    });

    it("accepts body without stallId (edit form)", async () => {
      mockUpdateDish.mockResolvedValue(dishResponse);

      const res = await request(app).put("/dishes/42").send(editDishBody);

      expect(res.status).toBe(200);
      expect(mockUpdateDish).toHaveBeenCalledWith(42, {
        ...editDishBody,
        category: undefined,
      });
    });

    it("returns 400 for invalid id or body", async () => {
      const resId = await request(app).put("/dishes/0").send(updateDishBody);
      expect(resId.status).toBe(400);
      expect(resId.body).toEqual({ error: "dish id must be a positive integer" });

      const resBody = await request(app).put("/dishes/42").send({ name: "Only" });
      expect(resBody.status).toBe(400);
      expect(resBody.body).toEqual({ error: "description is required" });
      expect(mockUpdateDish).not.toHaveBeenCalled();
    });

    it("returns 404 when the dish is not found", async () => {
      mockUpdateDish.mockRejectedValue(new NotFoundError("Dish with id 999 was not found"));

      const res = await request(app).put("/dishes/999").send(updateDishBody);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Dish with id 999 was not found" });
    });

    it("returns 503 when the service fails", async () => {
      mockUpdateDish.mockRejectedValue(
        new ServiceError("Unable to update dish. Please try again later.")
      );

      const res = await request(app).put("/dishes/42").send(updateDishBody);

      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        error: "Unable to update dish. Please try again later.",
      });
    });
  });

  describe("DELETE — DELETE /dishes/:id", () => {
    it("returns 200 and the deleted dish", async () => {
      mockDeleteDish.mockResolvedValue(dishResponse);

      const res = await request(app).delete("/dishes/42");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(dishResponse);
      expect(mockDeleteDish).toHaveBeenCalledWith(42);
    });

    it("returns 400 for an invalid id", async () => {
      const res = await request(app).delete("/dishes/abc");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "dish id must be a positive integer" });
      expect(mockDeleteDish).not.toHaveBeenCalled();
    });

    it("returns 404 when the dish does not exist", async () => {
      mockDeleteDish.mockRejectedValue(new NotFoundError("Dish with id 999 was not found"));

      const res = await request(app).delete("/dishes/999");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Dish with id 999 was not found" });
    });

    it("returns 503 when the service fails", async () => {
      mockDeleteDish.mockRejectedValue(
        new ServiceError("Unable to delete dish. Please try again later.")
      );

      const res = await request(app).delete("/dishes/42");

      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        error: "Unable to delete dish. Please try again later.",
      });
    });
  });
});
