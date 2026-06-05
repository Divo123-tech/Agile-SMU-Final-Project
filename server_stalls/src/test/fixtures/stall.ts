import type { CreateStallInput, StallResponse } from "../../types/stall";

export const createStallBody = {
  name: "The Golden Wok",
  description: "Authentic Chinese cuisine",
  address: "Food Court Level 2, Booth 12",
  owner: 42,
};

export const updateStallBody = {
  name: "The Golden Wok (Updated)",
  description: "Updated description",
  address: "Food Court Level 3, Booth 5",
};

export const createStallInput: CreateStallInput = {
  ...createStallBody,
  owner: 42,
  imageUrl: "https://example-bucket.s3.ap-southeast-1.amazonaws.com/stalls/photos/photo.jpg",
  proofOfOwnershipUrl:
    "https://example-bucket.s3.ap-southeast-1.amazonaws.com/stalls/proofs/proof.pdf",
};

export const stallResponse: StallResponse = {
  id: 1,
  name: createStallBody.name,
  owner: 42,
  description: createStallBody.description,
  address: createStallBody.address,
  image: createStallInput.imageUrl,
  proofOfOwnership: createStallInput.proofOfOwnershipUrl,
  status: "pending",
  adminNotes: null,
  updatedAt: "2026-05-23T10:00:00.000Z",
};

export const myStallsResponse = {
  userId: 42,
  count: 1,
  stalls: [stallResponse],
};

export const mockPhotoFile = {
  fieldname: "photo",
  originalname: "stall.jpg",
  encoding: "7bit",
  mimetype: "image/jpeg",
  buffer: Buffer.from("fake-image"),
  size: 1024,
} as Express.Multer.File;

export const mockProofFile = {
  fieldname: "proofOfOwnership",
  originalname: "proof.pdf",
  encoding: "7bit",
  mimetype: "application/pdf",
  buffer: Buffer.from("fake-pdf"),
  size: 2048,
} as Express.Multer.File;
