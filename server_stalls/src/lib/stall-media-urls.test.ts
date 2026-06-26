import { afterEach, describe, expect, it } from "vitest";
import {
  buildStallMediaClientUrl,
  buildStallMediaPath,
} from "./stall-media-urls";

describe("stall-media-urls", () => {
  afterEach(() => {
    delete process.env.STALLS_PUBLIC_BASE_URL;
  });

  it("builds media paths", () => {
    expect(buildStallMediaPath(3, "image")).toBe("/stalls/3/image");
    expect(buildStallMediaPath(3, "proof")).toBe("/stalls/3/proof-of-ownership");
  });

  it("returns null without public base URL", () => {
    expect(buildStallMediaClientUrl(1, "image")).toBeNull();
  });

  it("builds client URL when base is configured", () => {
    process.env.STALLS_PUBLIC_BASE_URL = "http://localhost:5000/";
    expect(buildStallMediaClientUrl(1, "image")).toBe(
      "http://localhost:5000/stalls/1/image"
    );
  });
});
