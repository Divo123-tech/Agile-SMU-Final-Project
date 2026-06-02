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
  updated_at?: Date | string | null;
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
