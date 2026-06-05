process.env.JWT_SECRET = "test-jwt-secret";

import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { signAccessToken } from "../lib/jwt";
import * as bookmarkService from "../services/bookmark.service";

vi.mock("../services/bookmark.service", () => ({
  listBookmarkedDishes: vi.fn(),
  addBookmark: vi.fn(),
  removeBookmark: vi.fn(),
}));

import app from "../app";

const mockList = vi.mocked(bookmarkService.listBookmarkedDishes);
const mockAdd = vi.mocked(bookmarkService.addBookmark);
const mockRemove = vi.mocked(bookmarkService.removeBookmark);

describe("Bookmark API", () => {
  let token: string;

  beforeAll(() => {
    token = signAccessToken({ sub: 1, email: "user@example.com", isAdmin: false });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /my-dishes", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).get("/my-dishes");
      expect(res.status).toBe(401);
    });

    it("returns saved dishes", async () => {
      mockList.mockResolvedValue({
        stalls: [{ id: 10, name: "Stall A" }],
        dishes: [],
      });

      const res = await request(app)
        .get("/my-dishes")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.stalls).toHaveLength(1);
    });
  });

  describe("POST /my-dishes/:dishId", () => {
    it("returns 201 when saved", async () => {
      mockAdd.mockResolvedValue({
        id: "1",
        stallId: 10,
        stallName: "Stall A",
        name: "Laksa",
        description: "",
        allergens: [],
        category: "Mains",
        savedAt: "2026-01-01T00:00:00.000Z",
      });

      const res = await request(app)
        .post("/my-dishes/1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Laksa");
    });
  });

  describe("DELETE /my-dishes/:dishId", () => {
    it("returns 204 when removed", async () => {
      mockRemove.mockResolvedValue(undefined);

      const res = await request(app)
        .delete("/my-dishes/1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(204);
    });
  });
});
