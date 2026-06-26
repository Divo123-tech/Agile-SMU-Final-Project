import { describe, expect, it, vi } from "vitest";
import { createMockNext, createMockReq, createMockRes } from "../test/helpers";
import { errorHandler } from "./errorHandler";

describe("errorHandler", () => {
  it("returns 500 with generic message", () => {
    const res = createMockRes();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandler(new Error("boom"), createMockReq(), res, createMockNext());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    consoleSpy.mockRestore();
  });
});
