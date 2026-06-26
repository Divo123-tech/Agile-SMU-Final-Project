import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ServiceError, ValidationError } from "../errors";
import { createMockNext, createMockRes } from "../test/helpers";
import {
  addBookmarkHandler,
  listMyDishesHandler,
  removeBookmarkHandler,
} from "./bookmark.controller";
import * as bookmarkService from "../services/bookmark.service";

vi.mock("../services/bookmark.service", () => ({
  addBookmark: vi.fn(),
  listBookmarkedDishes: vi.fn(),
  removeBookmark: vi.fn(),
}));

const mockAdd = vi.mocked(bookmarkService.addBookmark);
const mockList = vi.mocked(bookmarkService.listBookmarkedDishes);
const mockRemove = vi.mocked(bookmarkService.removeBookmark);

describe("Bookmark controller", () => {
  const res = createMockRes();
  let next: ReturnType<typeof createMockNext>;
  const authReq = { accountId: 1, params: {} } as {
    accountId: number;
    params: Record<string, string>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    next = createMockNext();
  });

  it("listMyDishesHandler returns dishes", async () => {
    const payload = { dishes: [], stalls: [] };
    mockList.mockResolvedValue(payload as never);

    await listMyDishesHandler(authReq as never, res, next);

    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it("addBookmarkHandler validates dishId", async () => {
    await addBookmarkHandler(
      { ...authReq, params: { dishId: "abc" } } as never,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("addBookmarkHandler creates bookmark", async () => {
    mockAdd.mockResolvedValue({ id: "1" } as never);

    await addBookmarkHandler(
      { ...authReq, params: { dishId: "5" } } as never,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockAdd).toHaveBeenCalledWith(1, 5);
  });

  it("removeBookmarkHandler returns 204", async () => {
    mockRemove.mockResolvedValue(undefined as never);

    await removeBookmarkHandler(
      { ...authReq, params: { dishId: "5" } } as never,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("maps NotFoundError to 404", async () => {
    mockAdd.mockRejectedValue(new NotFoundError("missing"));

    await addBookmarkHandler(
      { ...authReq, params: { dishId: "5" } } as never,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("maps ServiceError to 503", async () => {
    mockList.mockRejectedValue(new ServiceError("down"));

    await listMyDishesHandler(authReq as never, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
  });

  it("forwards unknown errors", async () => {
    const err = new Error("boom");
    mockRemove.mockRejectedValue(err);

    await removeBookmarkHandler(
      { ...authReq, params: { dishId: "5" } } as never,
      res,
      next
    );

    expect(next).toHaveBeenCalledWith(err);
  });
});
