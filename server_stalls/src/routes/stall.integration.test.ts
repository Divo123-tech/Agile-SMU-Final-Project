import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceError } from "../errors";
import * as stallMenuService from "../services/stall-menu.service";
import * as stallService from "../services/stall.service";
import {
  createStallBody,
  myStallsResponse,
  stallResponse,
  updateStallBody,
} from "../test/fixtures/stall";

vi.mock("../services/stall.service", () => ({
  createStall: vi.fn(),
  getMyStalls: vi.fn(),
  getStallById: vi.fn(),
  updateStall: vi.fn(),
  deleteStall: vi.fn(),
  getSignedStallMediaUrl: vi.fn(),
}));

vi.mock("../services/stall-menu.service", () => ({
  getStallMenu: vi.fn(),
}));

vi.mock("../lib/s3", () => ({
  uploadStallFileToS3: vi.fn((_, folder: "photos" | "proofs") =>
    Promise.resolve(
      folder === "photos"
        ? "https://example-bucket.s3.ap-southeast-1.amazonaws.com/stalls/photos/photo.jpg"
        : "https://example-bucket.s3.ap-southeast-1.amazonaws.com/stalls/proofs/proof.pdf"
    )
  ),
}));

import app from "../app";

const mockCreateStall = vi.mocked(stallService.createStall);
const mockGetMyStalls = vi.mocked(stallService.getMyStalls);
const mockGetStallById = vi.mocked(stallService.getStallById);
const mockUpdateStall = vi.mocked(stallService.updateStall);
const mockDeleteStall = vi.mocked(stallService.deleteStall);
const mockGetSignedStallMediaUrl = vi.mocked(stallService.getSignedStallMediaUrl);
const mockGetStallMenu = vi.mocked(stallMenuService.getStallMenu);

describe("Stall API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /stalls", () => {
    it("returns 201 and the created stall", async () => {
      mockCreateStall.mockResolvedValue(stallResponse);

      const res = await request(app)
        .post("/stalls")
        .field("name", createStallBody.name)
        .field("description", createStallBody.description)
        .field("address", createStallBody.address)
        .field("owner", String(createStallBody.owner))
        .attach("photo", Buffer.from("fake-image"), {
          filename: "stall.jpg",
          contentType: "image/jpeg",
        })
        .attach("proofOfOwnership", Buffer.from("fake-pdf"), {
          filename: "proof.pdf",
          contentType: "application/pdf",
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(stallResponse);
      expect(mockCreateStall).toHaveBeenCalled();
    });

    it("returns 400 when required text fields are missing", async () => {
      const res = await request(app)
        .post("/stalls")
        .attach("photo", Buffer.from("fake-image"), {
          filename: "stall.jpg",
          contentType: "image/jpeg",
        })
        .attach("proofOfOwnership", Buffer.from("fake-pdf"), {
          filename: "proof.pdf",
          contentType: "application/pdf",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "name is required" });
      expect(mockCreateStall).not.toHaveBeenCalled();
    });

    it("returns 503 when the service fails", async () => {
      mockCreateStall.mockRejectedValue(
        new ServiceError("Unable to create stall. Please try again later.")
      );

      const res = await request(app)
        .post("/stalls")
        .field("name", createStallBody.name)
        .field("description", createStallBody.description)
        .field("address", createStallBody.address)
        .field("owner", String(createStallBody.owner))
        .attach("photo", Buffer.from("fake-image"), {
          filename: "stall.jpg",
          contentType: "image/jpeg",
        })
        .attach("proofOfOwnership", Buffer.from("fake-pdf"), {
          filename: "proof.pdf",
          contentType: "application/pdf",
        });

      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        error: "Unable to create stall. Please try again later.",
      });
    });

    it("returns 500 when photo is not an image", async () => {
      const res = await request(app)
        .post("/stalls")
        .field("name", createStallBody.name)
        .field("description", createStallBody.description)
        .field("address", createStallBody.address)
        .field("owner", String(createStallBody.owner))
        .attach("photo", Buffer.from("not-image"), {
          filename: "stall.txt",
          contentType: "text/plain",
        })
        .attach("proofOfOwnership", Buffer.from("fake-pdf"), {
          filename: "proof.pdf",
          contentType: "application/pdf",
        });

      expect(res.status).toBe(500);
      expect(mockCreateStall).not.toHaveBeenCalled();
    });

    it("returns 500 when proof is not an image or PDF", async () => {
      const res = await request(app)
        .post("/stalls")
        .field("name", createStallBody.name)
        .field("description", createStallBody.description)
        .field("address", createStallBody.address)
        .field("owner", String(createStallBody.owner))
        .attach("photo", Buffer.from("fake-image"), {
          filename: "stall.jpg",
          contentType: "image/jpeg",
        })
        .attach("proofOfOwnership", Buffer.from("bad"), {
          filename: "proof.txt",
          contentType: "text/plain",
        });

      expect(res.status).toBe(500);
      expect(mockCreateStall).not.toHaveBeenCalled();
    });
  });

  describe("GET /stall/:id", () => {
    it("returns 200 and the stall menu", async () => {
      const menu = {
        stall: {
          name: stallResponse.name,
          description: stallResponse.description,
          image: stallResponse.image,
          address: stallResponse.address,
          owner: stallResponse.owner,
          updatedAt: stallResponse.updatedAt,
        },
        categories: [],
      };
      mockGetStallMenu.mockResolvedValue(menu);

      const res = await request(app).get("/stall/101");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(menu);
      expect(mockGetStallMenu).toHaveBeenCalledWith(101);
    });
  });

  describe("GET /stalls/:id", () => {
    it("returns 200 and the stall", async () => {
      mockGetStallById.mockResolvedValue(stallResponse);

      const res = await request(app).get("/stalls/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(stallResponse);
      expect(mockGetStallById).toHaveBeenCalledWith(1);
    });
  });

  describe("GET /stalls/:id/image", () => {
    it("redirects to signed image URL", async () => {
      mockGetSignedStallMediaUrl.mockResolvedValue("https://signed.example.com/photo.jpg");

      const res = await request(app).get("/stalls/1/image");

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("https://signed.example.com/photo.jpg");
      expect(mockGetSignedStallMediaUrl).toHaveBeenCalledWith(1, "image");
    });
  });

  describe("GET /stalls/:id/proof-of-ownership", () => {
    it("redirects to signed proof URL", async () => {
      mockGetSignedStallMediaUrl.mockResolvedValue("https://signed.example.com/proof.pdf");

      const res = await request(app).get("/stalls/1/proof-of-ownership");

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("https://signed.example.com/proof.pdf");
      expect(mockGetSignedStallMediaUrl).toHaveBeenCalledWith(1, "proof");
    });
  });

  describe("PUT /stalls/:id", () => {
    it("returns 200 and the updated stall", async () => {
      mockUpdateStall.mockResolvedValue(stallResponse);

      const res = await request(app)
        .put("/stalls/1")
        .field("name", updateStallBody.name)
        .field("description", updateStallBody.description)
        .field("address", updateStallBody.address);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(stallResponse);
      expect(mockUpdateStall).toHaveBeenCalled();
    });

    it("returns 500 when photo is not an image", async () => {
      const res = await request(app)
        .put("/stalls/1")
        .field("name", updateStallBody.name)
        .field("description", updateStallBody.description)
        .field("address", updateStallBody.address)
        .attach("photo", Buffer.from("bad"), {
          filename: "bad.txt",
          contentType: "text/plain",
        });

      expect(res.status).toBe(500);
      expect(mockUpdateStall).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /stalls/:id", () => {
    it("returns 200 and the deleted stall", async () => {
      mockDeleteStall.mockResolvedValue(stallResponse);

      const res = await request(app).delete("/stalls/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(stallResponse);
      expect(mockDeleteStall).toHaveBeenCalledWith(1);
    });
  });

  describe("GET /my-stalls/:userId", () => {
    it("returns 200 and the user's stalls", async () => {
      mockGetMyStalls.mockResolvedValue(myStallsResponse);

      const res = await request(app).get("/my-stalls/42");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(myStallsResponse);
      expect(mockGetMyStalls).toHaveBeenCalledWith(42);
    });

    it("returns 400 for an invalid userId", async () => {
      const res = await request(app).get("/my-stalls/abc");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "userId must be a positive integer" });
      expect(mockGetMyStalls).not.toHaveBeenCalled();
    });
  });
});
