export type StallStatus = "pending" | "approved" | "rejected";

export const STALL_STATUSES: StallStatus[] = [
  "pending",
  "approved",
  "rejected",
];

export type CreateStallInput = {
  name: string;
  owner: number;
  description: string;
  address: string;
  imageUrl: string;
  proofOfOwnershipUrl: string;
};

export type StallResponse = {
  id: number;
  name: string;
  owner: number;
  description: string;
  address: string;
  image: string;
  proofOfOwnership: string;
  status: StallStatus;
  adminNotes: string | null;
  updatedAt: string | null;
};

export type StallRow = {
  id: number;
  name: string;
  owner: number;
  description: string | null;
  address: string | null;
  image_url: string | null;
  proof_of_ownership_url: string | null;
  status: StallStatus;
  admin_notes: string | null;
  updated_at?: Date | string | null;
};

export type AdminStallResponse = StallResponse & {
  ownerEmail: string | null;
};

export type PendingStallsResponse = {
  count: number;
  stalls: AdminStallResponse[];
};

export type MyStallsResponse = {
  userId: number;
  count: number;
  stalls: StallResponse[];
};

export type StallsResponse = {
  count: number;
  stalls: StallResponse[];
};

export type UpdateStallInput = {
  name: string;
  description: string;
  address: string;
  imageUrl?: string;
  proofOfOwnershipUrl?: string;
};
