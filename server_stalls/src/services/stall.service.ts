import { pool } from "../db";
import { NotFoundError, ServiceError } from "../errors";
import { resolveImageUrlForClient } from "../lib/s3";
import type {
  CreateStallInput,
  MyStallsResponse,
  StallResponse,
  StallRow,
  UpdateStallInput,
} from "../types/stall";

async function stallRowToResponse(row: StallRow): Promise<StallResponse> {
  const imageUrl = row.image_url?.trim() ?? "";

  return {
    id: row.id,
    name: row.name,
    description: row.description?.trim() ?? "",
    owner: row.owner,
    address: row.address?.trim() ?? "",
    image: await resolveImageUrlForClient(imageUrl),
    proofOfOwnership: row.proof_of_ownership_url?.trim() ?? "",
  };
}

export async function createStall(input: CreateStallInput): Promise<StallResponse> {
  try {
    const { rows } = await pool.query<StallRow>(`
      INSERT INTO stalls (name, owner, description, address, image_url, proof_of_ownership_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, owner, description, address, image_url, proof_of_ownership_url`,
      [
        input.name,
        input.owner,
        input.description,
        input.address,
        input.imageUrl,
        input.proofOfOwnershipUrl,
      ]
    );
    return stallRowToResponse(rows[0]);
  } catch (err) {
    console.error(`createStall failed for name=${input.name}:`, err);
    throw new ServiceError("Unable to create stall. Please try again later.");
  }
}

export async function getStallById(stallId: number): Promise<StallResponse> {
  try {
    const { rows } = await pool.query<StallRow>(
      `SELECT id, name, owner, description, address, image_url, proof_of_ownership_url
       FROM stalls
       WHERE id = $1
       LIMIT 1`,
      [stallId]
    );

    if (rows.length === 0) {
      throw new NotFoundError(`Stall with id ${stallId} was not found`);
    }

    return stallRowToResponse(rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }

    console.error(`getStallById failed for stallId=${stallId}:`, err);
    throw new ServiceError("Unable to load stall. Please try again later.");
  }
}

export async function updateStall(
  stallId: number,
  input: UpdateStallInput
): Promise<StallResponse> {
  try {
    const existing = await pool.query<StallRow>(
      `SELECT id, name, owner, description, address, image_url, proof_of_ownership_url
       FROM stalls
       WHERE id = $1
       LIMIT 1`,
      [stallId]
    );

    if (existing.rows.length === 0) {
      throw new NotFoundError(`Stall with id ${stallId} was not found`);
    }

    const current = existing.rows[0];
    const imageUrl = input.imageUrl ?? current.image_url ?? "";
    const proofOfOwnershipUrl =
      input.proofOfOwnershipUrl ?? current.proof_of_ownership_url ?? "";

    const { rows } = await pool.query<StallRow>(
      `UPDATE stalls
       SET name = $1, description = $2, address = $3, image_url = $4, proof_of_ownership_url = $5
       WHERE id = $6
       RETURNING id, name, owner, description, address, image_url, proof_of_ownership_url`,
      [
        input.name,
        input.description,
        input.address,
        imageUrl,
        proofOfOwnershipUrl,
        stallId,
      ]
    );

    return stallRowToResponse(rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }

    console.error(`updateStall failed for stallId=${stallId}:`, err);
    throw new ServiceError("Unable to update stall. Please try again later.");
  }
}

export async function deleteStall(stallId: number): Promise<StallResponse> {
  try {
    const existing = await pool.query<StallRow>(
      `SELECT id, name, owner, description, address, image_url, proof_of_ownership_url
       FROM stalls
       WHERE id = $1
       LIMIT 1`,
      [stallId]
    );

    if (existing.rows.length === 0) {
      throw new NotFoundError(`Stall with id ${stallId} was not found`);
    }

    await pool.query("DELETE FROM dishes WHERE stall_id = $1", [stallId]);

    const { rows } = await pool.query<StallRow>(
      `DELETE FROM stalls
       WHERE id = $1
       RETURNING id, name, owner, description, address, image_url, proof_of_ownership_url`,
      [stallId]
    );

    return stallRowToResponse(rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }

    console.error(`deleteStall failed for stallId=${stallId}:`, err);
    throw new ServiceError("Unable to delete stall. Please try again later.");
  }
}

export async function getMyStalls(ownerId: number): Promise<MyStallsResponse> {
  try {
    const { rows } = await pool.query<StallRow>(
      `SELECT id, name, owner, description, address, image_url, proof_of_ownership_url
       FROM stalls
       WHERE owner = $1
       ORDER BY id ASC`,
      [ownerId]
    );

    const stalls = await Promise.all(rows.map(stallRowToResponse));

    return {
      userId: ownerId,
      count: stalls.length,
      stalls,
    };
  } catch (err) {
    console.error(`getMyStalls failed for ownerId=${ownerId}:`, err);
    throw new ServiceError("Unable to load stalls. Please try again later.");
  }
}
