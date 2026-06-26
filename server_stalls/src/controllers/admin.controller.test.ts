import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ServiceError, ValidationError } from "../errors";
import { stallResponse } from "../test/fixtures/stall";
import { createMockNext, createMockRes } from "../test/helpers";
import {
  getPendingStallHandler,
  getPendingStallMenuHandler,
  listPendingStallsHandler,
  reviewStallHandler,
} from "./admin.controller";
import * as adminService from "../services/admin.service";
import * as stallMenuService from "../services/stall-menu.service";

vi.mock("../services/admin.service", () => ({
  listPendingStalls: vi.fn(),
  getAdminStallById: vi.fn(),
  setStallStatus: vi.fn(),
}));

vi.mock("../services/stall-menu.service", () => ({
  getAdminStallMenu: vi.fn(),
}));

const mockList = vi.mocked(adminService.listPendingStalls);
const mockGet = vi.mocked(adminService.getAdminStallById);
const mockReview = vi.mocked(adminService.setStallStatus);
const mockMenu = vi.mocked(stallMenuService.getAdminStallMenu);

describe("admin.controller", () => {
  const res = createMockRes();
  let next: ReturnType<typeof createMockNext>;
  const authReq = { params: {}, body: {} } as {
    params: Record<string, string>;
    body: unknown;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    next = createMockNext();
  });

  it("listPendingStallsHandler returns pending stalls", async () => {
    mockList.mockResolvedValue({ count: 1, stalls: [stallResponse as never] });

    await listPendingStallsHandler(authReq as never, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  it("getPendingStallHandler validates stall id", async () => {
    await getPendingStallHandler(
      { ...authReq, params: { id: "abc" } } as never,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("getPendingStallHandler returns stall", async () => {
    mockGet.mockResolvedValue(stallResponse as never);

    await getPendingStallHandler(
      { ...authReq, params: { id: "1" } } as never,
      res,
      next
    );

    expect(res.json).toHaveBeenCalledWith(stallResponse);
  });

  it("getPendingStallMenuHandler returns menu", async () => {
    const menu = { stall: null, categories: [] };
    mockMenu.mockResolvedValue(menu as never);

    await getPendingStallMenuHandler(
      { ...authReq, params: { id: "1" } } as never,
      res,
      next
    );

    expect(res.json).toHaveBeenCalledWith(menu);
  });

  it("reviewStallHandler validates body", async () => {
    await reviewStallHandler(
      { ...authReq, params: { id: "1" }, body: {} } as never,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("reviewStallHandler approves stall", async () => {
    mockReview.mockResolvedValue({ ...stallResponse, status: "approved" } as never);

    await reviewStallHandler(
      {
        ...authReq,
        params: { id: "1" },
        body: { status: "approved" },
      } as never,
      res,
      next
    );

    expect(mockReview).toHaveBeenCalledWith(1, "approved", undefined);
  });

  it("maps service errors", async () => {
    mockGet.mockRejectedValue(new NotFoundError("missing"));

    await getPendingStallHandler(
      { ...authReq, params: { id: "1" } } as never,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("forwards unknown errors", async () => {
    const err = new Error("boom");
    mockList.mockRejectedValue(err);

    await listPendingStallsHandler(authReq as never, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });

  it("maps ServiceError to 503", async () => {
    mockReview.mockRejectedValue(new ServiceError("down"));

    await reviewStallHandler(
      {
        ...authReq,
        params: { id: "1" },
        body: { status: "approved" },
      } as never,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(503);
  });

  it("maps ValidationError from service", async () => {
    mockReview.mockRejectedValue(new ValidationError("bad"));

    await reviewStallHandler(
      {
        ...authReq,
        params: { id: "1" },
        body: { status: "rejected", adminNotes: "" },
      } as never,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
