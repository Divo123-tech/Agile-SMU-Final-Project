import { beforeEach, describe, expect, it, vi } from "vitest";
import { pool, testConnection } from "./db";

describe("db", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("testConnection runs SELECT 1 and releases client", async () => {
    const release = vi.fn();
    const query = vi.fn().mockResolvedValue({});
    vi.spyOn(pool, "connect").mockResolvedValue({ query, release } as never);

    await testConnection();

    expect(query).toHaveBeenCalledWith("SELECT 1");
    expect(release).toHaveBeenCalled();
  });
});
