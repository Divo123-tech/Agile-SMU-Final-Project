import { describe, expect, it } from "vitest";
import { stallUpdatedAtToIso } from "./stall-row";

describe("stall-row", () => {
  it("converts Date to ISO string", () => {
    const date = new Date("2026-05-23T10:00:00.000Z");
    expect(stallUpdatedAtToIso(date)).toBe("2026-05-23T10:00:00.000Z");
  });

  it("converts string dates", () => {
    expect(stallUpdatedAtToIso("2026-05-23T10:00:00.000Z")).toBe(
      "2026-05-23T10:00:00.000Z"
    );
  });

  it("returns null for missing or invalid values", () => {
    expect(stallUpdatedAtToIso(null)).toBeNull();
    expect(stallUpdatedAtToIso(undefined)).toBeNull();
    expect(stallUpdatedAtToIso("not-a-date")).toBeNull();
  });
});
