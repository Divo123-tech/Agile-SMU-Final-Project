import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  buildPublicUrl,
  getObjectKeyFromStoredUrl,
  resolveStallFileUrlForClient,
  uploadStallFileToS3,
} from "./s3";
import { mockPhotoFile } from "../test/fixtures/stall";

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = mockSend;
  },
  GetObjectCommand: class {
    constructor(public input: unknown) {}
  },
  PutObjectCommand: class {
    constructor(public input: unknown) {}
  },
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

const mockGetSignedUrl = vi.mocked(getSignedUrl);

describe("s3", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AWS_REGION = "ap-southeast-1";
    process.env.AWS_ACCESS_KEY_ID = "key";
    process.env.AWS_SECRET_ACCESS_KEY = "secret";
    process.env.S3_BUCKET = "test-bucket";
    delete process.env.S3_PUBLIC_BASE_URL;
    delete process.env.S3_USE_PRESIGNED_URLS;
    delete process.env.S3_PHOTOS_PUBLIC;
    mockSend.mockResolvedValue({});
    mockGetSignedUrl.mockResolvedValue("https://signed.example.com/file");
  });

  afterEach(() => {
    delete process.env.S3_PUBLIC_BASE_URL;
    delete process.env.S3_USE_PRESIGNED_URLS;
    delete process.env.S3_PHOTOS_PUBLIC;
  });

  it("extracts object keys from stored URLs", () => {
    expect(getObjectKeyFromStoredUrl("stalls/photos/a.jpg")).toBe(
      "stalls/photos/a.jpg"
    );
    expect(
      getObjectKeyFromStoredUrl(
        "https://test-bucket.s3.ap-southeast-1.amazonaws.com/stalls/photos/a.jpg"
      )
    ).toBe("stalls/photos/a.jpg");
    expect(getObjectKeyFromStoredUrl("https://example.com/other")).toBeNull();
  });

  it("builds default public URLs", () => {
    expect(buildPublicUrl("stalls/photos/a.jpg")).toBe(
      "https://test-bucket.s3.ap-southeast-1.amazonaws.com/stalls/photos/a.jpg"
    );
  });

  it("builds custom public URLs", () => {
    process.env.S3_PUBLIC_BASE_URL = "https://cdn.example.com";
    expect(buildPublicUrl("stalls/photos/a.jpg")).toBe(
      "https://cdn.example.com/stalls/photos/a.jpg"
    );
  });

  it("returns empty string for blank stored URL", async () => {
    expect(await resolveStallFileUrlForClient("  ")).toBe("");
  });

  it("returns stored URL when presigning is disabled", async () => {
    process.env.S3_USE_PRESIGNED_URLS = "false";
    const url = "https://test-bucket.s3.ap-southeast-1.amazonaws.com/stalls/photos/a.jpg";
    expect(await resolveStallFileUrlForClient(url)).toBe(url);
  });

  it("presigns private stall object keys", async () => {
    const url = "https://test-bucket.s3.ap-southeast-1.amazonaws.com/stalls/photos/a.jpg";

    await expect(resolveStallFileUrlForClient(url)).resolves.toBe(
      "https://signed.example.com/file"
    );
    expect(mockGetSignedUrl).toHaveBeenCalled();
  });

  it("falls back to stored URL when signing fails", async () => {
    mockGetSignedUrl.mockRejectedValueOnce(new Error("sign failed"));
    const url = "https://test-bucket.s3.ap-southeast-1.amazonaws.com/stalls/photos/a.jpg";
    await expect(resolveStallFileUrlForClient(url)).resolves.toBe(url);
  });

  it("uploads stall files and returns canonical URL", async () => {
    const result = await uploadStallFileToS3(mockPhotoFile, "photos");
    expect(result).toContain("stalls/photos/");
    expect(mockSend).toHaveBeenCalled();
  });

  it("rejects uploads without buffer", async () => {
    await expect(
      uploadStallFileToS3({ ...mockPhotoFile, buffer: undefined } as never, "photos")
    ).rejects.toThrow("File upload failed");
  });

  it("returns stored URL for non-private keys", async () => {
    const url = "https://cdn.example.com/marketing/banner.jpg";
    await expect(resolveStallFileUrlForClient(url)).resolves.toBe(url);
  });

  it("returns stored URL when key cannot be parsed", async () => {
    await expect(resolveStallFileUrlForClient("not-a-url")).resolves.toBe("not-a-url");
  });

  it("strips bucket prefix from stored URLs", async () => {
    const url =
      "https://test-bucket.s3.ap-southeast-1.amazonaws.com/test-bucket/stalls/photos/a.jpg";
    await expect(resolveStallFileUrlForClient(url)).resolves.toBe(
      "https://signed.example.com/file"
    );
  });

  it("uses public-read ACL for public photos", async () => {
    process.env.S3_PHOTOS_PUBLIC = "true";
    await uploadStallFileToS3(mockPhotoFile, "photos");
    expect(mockSend).toHaveBeenCalled();
  });

  it("wraps upload failures as ServiceError", async () => {
    mockSend.mockRejectedValueOnce(new Error("s3 down"));
    await expect(uploadStallFileToS3(mockPhotoFile, "proofs")).rejects.toThrow(
      "Unable to upload file"
    );
  });

  it("reuses cached S3 client with optional endpoint settings", async () => {
    process.env.AWS_SESSION_TOKEN = "session";
    process.env.S3_ENDPOINT = "https://s3.local";
    process.env.S3_FORCE_PATH_STYLE = "true";
    const url = "https://test-bucket.s3.ap-southeast-1.amazonaws.com/stalls/photos/a.jpg";
    await resolveStallFileUrlForClient(url);
    await resolveStallFileUrlForClient(url);
    expect(mockGetSignedUrl).toHaveBeenCalled();
  });
});
