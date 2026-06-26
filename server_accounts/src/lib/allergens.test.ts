import { describe, expect, it } from "vitest";
import { allergiesEqual, normalizeAllergies } from "./allergens";

describe("allergens", () => {
  it("normalizes valid allergens and deduplicates", () => {
    expect(normalizeAllergies(["dairy", "nuts", "dairy", "invalid"])).toEqual([
      "dairy",
      "nuts",
    ]);
  });

  it("returns empty array when no valid allergens", () => {
    expect(normalizeAllergies(["invalid", ""])).toEqual([]);
  });

  it("compares allergies after normalization", () => {
    expect(allergiesEqual(["nuts", "dairy"], ["dairy", "nuts"])).toBe(false);
    expect(allergiesEqual(["dairy", "nuts"], ["dairy", "nuts"])).toBe(true);
    expect(allergiesEqual(["dairy"], ["dairy", "nuts"])).toBe(false);
  });
});
