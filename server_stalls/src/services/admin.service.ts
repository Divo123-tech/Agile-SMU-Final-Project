import { pool } from "../db";
import { NotFoundError, ServiceError, ValidationError } from "../errors";
import { stallUpdatedAtToIso } from "../lib/stall-row";
import { resolveImageUrlForClient } from "../lib/s3";
import type {
  AdminStallResponse,
  PendingStallsResponse,
  StallRow,
  StallStatus,
} from "../types/stall";

type AdminStallRow = StallRow & {
  owner_email: string | null;
};

const ADMIN_STALL_FROM = `
  FROM stalls s
  LEFT JOIN accounts a ON a.id = s.owner
`;

const ADMIN_STALL_SELECT = `
  s.id, s.name, s.owner, s.description, s.address, s.image_url, s.proof_of_ownership_url, s.status, s.admin_notes, s.updated_at,
  a.email AS owner_email
`;

async function adminStallRowToResponse(
  row: AdminStallRow
): Promise<AdminStallResponse> {
  const imageUrl = row.image_url?.trim() ?? "";

  return {
    id: row.id,
    name: row.name,
    description: row.description?.trim() ?? "",
    owner: row.owner,
    address: row.address?.trim() ?? "",
    image: await resolveImageUrlForClient(imageUrl),
    proofOfOwnership: row.proof_of_ownership_url?.trim() ?? "",
    status: row.status,
    adminNotes: row.admin_notes?.trim() || null,
    updatedAt: stallUpdatedAtToIso(row.updated_at),
    ownerEmail: row.owner_email,
  };
}

export async function listPendingStalls(): Promise<PendingStallsResponse> {
  try {
    const { rows } = await pool.query<AdminStallRow>(
      `SELECT ${ADMIN_STALL_SELECT}
       ${ADMIN_STALL_FROM}
       WHERE s.status = 'pending'
       ORDER BY s.id ASC`
    );

    const stalls = await Promise.all(rows.map(adminStallRowToResponse));

    return {
      count: stalls.length,
      stalls,
    };
  } catch (err) {
    console.error("listPendingStalls failed:", err);
    throw new ServiceError(
      "Unable to load pending stalls. Please try again later."
    );
  }
}

export async function getAdminStallById(
  stallId: number
): Promise<AdminStallResponse> {
  try {
    const { rows } = await pool.query<AdminStallRow>(
      `SELECT ${ADMIN_STALL_SELECT}
       ${ADMIN_STALL_FROM}
       WHERE s.id = $1
       LIMIT 1`,
      [stallId]
    );

    if (rows.length === 0) {
      throw new NotFoundError(`Stall with id ${stallId} was not found`);
    }

    return adminStallRowToResponse(rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }

    console.error(`getAdminStallById failed for stallId=${stallId}:`, err);
    throw new ServiceError("Unable to load stall. Please try again later.");
  }
}

export async function setStallStatus(
  stallId: number,
  status: StallStatus,
  adminNotes?: string | null
): Promise<AdminStallResponse> {
  if (status !== "approved" && status !== "rejected") {
    throw new ValidationError("status must be approved or rejected");
  }

  if (status === "rejected") {
    const notes = adminNotes?.trim() ?? "";
    if (!notes) {
      throw new ValidationError("adminNotes is required when rejecting a stall");
    }
  }

  try {
    const notesValue = status === "rejected" ? adminNotes!.trim() : null;

    const { rowCount } = await pool.query(
      `UPDATE stalls
       SET status = $1, admin_notes = $2, updated_at = NOW()
       WHERE id = $3 AND status = 'pending'`,
      [status, notesValue, stallId]
    );

    if (rowCount === 0) {
      throw new NotFoundError(
        "Pending stall not found or already reviewed"
      );
    }

    return getAdminStallById(stallId);
  } catch (err) {
    if (err instanceof ValidationError || err instanceof NotFoundError) {
      throw err;
    }

    console.error(
      `setStallStatus failed for stallId=${stallId} status=${status}:`,
      err
    );
    throw new ServiceError("Unable to update stall status. Please try again later.");
  }
}
