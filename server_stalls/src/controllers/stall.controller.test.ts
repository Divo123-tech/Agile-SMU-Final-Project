import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceError } from "../errors";
import {
  createStallBody,
  mockPhotoFile,
  mockProofFile,
  myStallsResponse,
  stallResponse,
} from "../test/fixtures/stall";
import { createMockNext, createMockReq, createMockRes } from "../test/helpers";
import {
  createStallHandler,
  deleteStallHandler,
  getMyStallsHandler,
  getStallsHandler,
  getStallByIdHandler,
  getStallMenuHandler,
  redirectStallImageHandler,
  redirectStallProofHandler,
  updateStallHandler,
} from "./stall.controller";
import * as stallMenuService from "../services/stall-menu.service";
import * as stallService from "../services/stall.service";
import * as s3 from "../lib/s3";
import { NotFoundError } from "../errors";
import { updateStallBody } from "../test/fixtures/stall";

vi.mock("../services/stall.service", () => ({
  createStall: vi.fn(),
  getMyStalls: vi.fn(),
  getStalls: vi.fn(),
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

vi.mock("../lib/admin-realtime", () => ({
  notifyPendingStallCreated: vi.fn(),
}));

const mockCreateStall = vi.mocked(stallService.createStall);
const mockGetMyStalls = vi.mocked(stallService.getMyStalls);
const mockGetStalls = vi.mocked(stallService.getStalls);
const mockGetStallById = vi.mocked(stallService.getStallById);
const mockUpdateStall = vi.mocked(stallService.updateStall);
const mockDeleteStall = vi.mocked(stallService.deleteStall);
const mockGetSignedStallMediaUrl = vi.mocked(stallService.getSignedStallMediaUrl);
const mockGetStallMenu = vi.mocked(stallMenuService.getStallMenu);
const mockUploadStallFileToS3 = vi.mocked(s3.uploadStallFileToS3);

describe("Stall controller — create", () => {
  const res = createMockRes();
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = createMockNext();
  });

  it("returns 201 with the created stall", async () => {
    mockCreateStall.mockResolvedValue(stallResponse);

    await createStallHandler(
      createMockReq({
        body: createStallBody,
        files: { photo: [mockPhotoFile], proofOfOwnership: [mockProofFile] },
      }),
      res,
      next
    );

    expect(mockCreateStall).toHaveBeenCalled();
    expect(mockUploadStallFileToS3).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(stallResponse);
  });

  it.each([
    [null, "Request body is required"],
    [{}, "name is required"],
    [{ name: "A" }, "description is required"],
    [{ name: "A", description: "B" }, "address is required"],
  ])("returns 400 for invalid body %j", async (body, errorMessage) => {
    await createStallHandler(
      createMockReq({
        body,
        files: { photo: [mockPhotoFile], proofOfOwnership: [mockProofFile] },
      }),
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    expect(mockCreateStall).not.toHaveBeenCalled();
  });

  it("returns 400 when photo is missing", async () => {
    await createStallHandler(
      createMockReq({
        body: createStallBody,
        files: { proofOfOwnership: [mockProofFile] },
      }),
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "photo is required" });
  });

  it("returns 400 when proof is missing", async () => {
    await createStallHandler(
      createMockReq({
        body: createStallBody,
        files: { photo: [mockPhotoFile] },
      }),
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "proofOfOwnership is required" });
  });

  it("returns 400 for invalid owner", async () => {
    await createStallHandler(
      createMockReq({
        body: { ...createStallBody, owner: "abc" },
        files: { photo: [mockPhotoFile], proofOfOwnership: [mockProofFile] },
      }),
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "owner must be a positive integer",
    });
  });

  it("returns 503 when the service fails", async () => {
    mockCreateStall.mockRejectedValue(
      new ServiceError("Unable to create stall. Please try again later.")
    );

    await createStallHandler(
      createMockReq({
        body: createStallBody,
        files: { photo: [mockPhotoFile], proofOfOwnership: [mockProofFile] },
      }),
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(503);
  });
});

describe("Stall controller — list stalls", () => {
  const res = createMockRes();
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = createMockNext();
  });

  it("returns approved stalls", async () => {
    const list = { count: 1, stalls: [stallResponse] };
    mockGetStalls.mockResolvedValue(list as never);

    await getStallsHandler(createMockReq(), res, next);

    expect(res.json).toHaveBeenCalledWith(list);
  });

  it("returns 503 when listing fails", async () => {
    mockGetStalls.mockRejectedValue(
      new ServiceError("Unable to load stalls. Please try again later.")
    );

    await getStallsHandler(createMockReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(503);
  });
});

describe("Stall controller — get my stalls", () => {
  const res = createMockRes();
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = createMockNext();
  });

  it("returns 200 with stalls for the user", async () => {
    mockGetMyStalls.mockResolvedValue(myStallsResponse);

    await getMyStallsHandler(
      createMockReq({ params: { userId: "42" } }),
      res,
      next
    );

    expect(mockGetMyStalls).toHaveBeenCalledWith(42);
    expect(res.json).toHaveBeenCalledWith(myStallsResponse);
  });

  it.each(["0", "-1", "abc", "1.5"])(
    "returns 400 for invalid userId %s",
    async (userId) => {
      await getMyStallsHandler(
        createMockReq({ params: { userId } }),
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "userId must be a positive integer",
      });
      expect(mockGetMyStalls).not.toHaveBeenCalled();
    }
  );

  it("returns 503 when the service fails", async () => {
    mockGetMyStalls.mockRejectedValue(
      new ServiceError("Unable to load stalls. Please try again later.")
    );

    await getMyStallsHandler(
      createMockReq({ params: { userId: "42" } }),
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(503);
  });
});

describe("Stall controller — get by id", () => {
  const res = createMockRes();
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = createMockNext();
  });

  it("returns 200 with the stall", async () => {
    mockGetStallById.mockResolvedValue(stallResponse);

    await getStallByIdHandler(
      createMockReq({ params: { id: "1" } }),
      res,
      next
    );

    expect(mockGetStallById).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(stallResponse);
  });

  it("returns 404 when the stall is not found", async () => {
    mockGetStallById.mockRejectedValue(
      new NotFoundError("Stall with id 99 was not found")
    );

    await getStallByIdHandler(
      createMockReq({ params: { id: "99" } }),
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("Stall controller — update", () => {
  const res = createMockRes();
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = createMockNext();
  });

  it("returns 200 with the updated stall", async () => {
    mockUpdateStall.mockResolvedValue(stallResponse);

    await updateStallHandler(
      createMockReq({
        params: { id: "1" },
        body: updateStallBody,
        files: {},
      }),
      res,
      next
    );

    expect(mockUpdateStall).toHaveBeenCalledWith(1, updateStallBody);
    expect(res.json).toHaveBeenCalledWith(stallResponse);
  });

  it("uploads new files when provided", async () => {
    mockUpdateStall.mockResolvedValue(stallResponse);

    await updateStallHandler(
      createMockReq({
        params: { id: "1" },
        body: updateStallBody,
        files: { photo: [mockPhotoFile], proofOfOwnership: [mockProofFile] },
      }),
      res,
      next
    );

    expect(mockUploadStallFileToS3).toHaveBeenCalledTimes(2);
    expect(mockUpdateStall).toHaveBeenCalled();
  });

  it("returns 400 for invalid body", async () => {
    await updateStallHandler(
      createMockReq({
        params: { id: "1" },
        body: {},
        files: {},
      }),
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 404 when stall is missing", async () => {
    mockUpdateStall.mockRejectedValue(new NotFoundError("Stall with id 1 was not found"));

    await updateStallHandler(
      createMockReq({
        params: { id: "1" },
        body: updateStallBody,
        files: {},
      }),
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("Stall controller — get menu", () => {
  const res = createMockRes();
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = createMockNext();
  });

  it("returns 200 with the stall menu on success", async () => {
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

    await getStallMenuHandler(
      createMockReq({ params: { id: "101" } }),
      res,
      next
    );

    expect(mockGetStallMenu).toHaveBeenCalledWith(101);
    expect(res.json).toHaveBeenCalledWith(menu);
  });

  it("returns 404 when the stall is not found", async () => {
    mockGetStallMenu.mockRejectedValue(
      new NotFoundError("Stall with id 999 was not found")
    );

    await getStallMenuHandler(
      createMockReq({ params: { id: "999" } }),
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Stall with id 999 was not found",
      stall: null,
      categories: [],
    });
  });

  it("returns 503 when menu loading fails", async () => {
    mockGetStallMenu.mockRejectedValue(
      new ServiceError("Unable to load stall menu. Please try again later.")
    );

    await getStallMenuHandler(
      createMockReq({ params: { id: "101" } }),
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(503);
  });
});

describe("Stall controller — delete", () => {
  const res = createMockRes();
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = createMockNext();
  });

  it("returns 200 with the deleted stall", async () => {
    mockDeleteStall.mockResolvedValue(stallResponse);

    await deleteStallHandler(
      createMockReq({ params: { id: "1" } }),
      res,
      next
    );

    expect(mockDeleteStall).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(stallResponse);
  });

  it("returns 404 when stall is missing", async () => {
    mockDeleteStall.mockRejectedValue(new NotFoundError("Stall with id 9 was not found"));

    await deleteStallHandler(
      createMockReq({ params: { id: "9" } }),
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });
});


describe("Stall controller — media redirects", () => {
  const res = createMockRes();
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = createMockNext();
    res.redirect = vi.fn();
  });

  it("redirects to signed image URL", async () => {
    mockGetSignedStallMediaUrl.mockResolvedValue("https://signed.example.com/photo.jpg");

    await redirectStallImageHandler(
      createMockReq({ params: { id: "1" } }),
      res,
      next
    );

    expect(mockGetSignedStallMediaUrl).toHaveBeenCalledWith(1, "image");
    expect(res.redirect).toHaveBeenCalledWith(302, "https://signed.example.com/photo.jpg");
  });

  it("redirects to signed proof URL", async () => {
    mockGetSignedStallMediaUrl.mockResolvedValue("https://signed.example.com/proof.pdf");

    await redirectStallProofHandler(
      createMockReq({ params: { id: "2" } }),
      res,
      next
    );

    expect(mockGetSignedStallMediaUrl).toHaveBeenCalledWith(2, "proof");
    expect(res.redirect).toHaveBeenCalledWith(302, "https://signed.example.com/proof.pdf");
  });

  it("returns 404 when media is missing", async () => {
    mockGetSignedStallMediaUrl.mockRejectedValue(
      new NotFoundError("Stall with id 1 has no photo")
    );

    await redirectStallImageHandler(
      createMockReq({ params: { id: "1" } }),
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
