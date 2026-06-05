import { pool } from "../db";
import { NotFoundError, ServiceError } from "../errors";
import { STALL_SELECT_COLUMNS, stallUpdatedAtToIso } from "../lib/stall-row";
import { resolveImageUrlForClient } from "../lib/s3";
import type { StallRow } from "../types/stall";
import type {
  CategoryGroup,
  DishOut,
  DishRow,
  StallMenuOut,
  StallMenuResponse,
} from "../types/menu";

async function stallFromRow(row: StallRow | undefined): Promise<StallMenuOut | null> {
  if (!row) return null;
  const name = row.name;
  if (name == null || String(name).trim() === "") return null;
  const imageUrl = (row.image_url ?? "").trim();
  return {
    name: String(name),
    description: row.description?.trim() ?? "",
    image: await resolveImageUrlForClient(imageUrl),
    address: row.address?.trim() ?? "",
    owner: row.owner,
    updatedAt: stallUpdatedAtToIso(row.updated_at),
  };
}

function groupDishesByCategory(rows: DishRow[]): CategoryGroup[] {
  const byCategory = new Map<string, DishOut[]>();

  for (const row of rows) {
    const categoryName = row.category?.trim() || "Other";
    const dish: DishOut = {
      id: String(row.dish_id),
      name: row.dish_name,
      description: row.description ?? "",
      allergens: row.allergens
        ? row.allergens.split(",").map((a) => a.trim()).filter(Boolean)
        : [],
    };

    const list = byCategory.get(categoryName);
    if (list) {
      list.push(dish);
    } else {
      byCategory.set(categoryName, [dish]);
    }
  }

  return [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map(([category, dishes]) => ({ category, dishes }));
}

async function loadStallMenu(
  stallId: number,
  stallWhere: string
): Promise<StallMenuResponse> {
  const [stallRes, dishRes] = await Promise.all([
    pool.query<StallRow>(
      `SELECT ${STALL_SELECT_COLUMNS}
       FROM stalls WHERE id = $1 AND ${stallWhere} LIMIT 1`,
      [stallId]
    ),
    pool.query<DishRow>("SELECT * FROM dishes WHERE stall_id = $1", [stallId]),
  ]);

  if (stallRes.rows.length === 0) {
    throw new NotFoundError(`Stall with id ${stallId} was not found`);
  }

  const stall = await stallFromRow(stallRes.rows[0]);
  if (!stall) {
    throw new NotFoundError(`Stall with id ${stallId} was not found`);
  }

  return {
    stall,
    categories: groupDishesByCategory(dishRes.rows),
  };
}

async function loadStallMenuSafe(
  stallId: number,
  stallWhere: string,
  logLabel: string
): Promise<StallMenuResponse> {
  try {
    return await loadStallMenu(stallId, stallWhere);
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }

    console.error(`${logLabel} failed for stallId=${stallId}:`, err);
    throw new ServiceError("Unable to load stall menu. Please try again later.");
  }
}

export async function getStallMenu(stallId: number): Promise<StallMenuResponse> {
  return loadStallMenuSafe(stallId, "status = 'approved'", "getStallMenu");
}

/** Menu for a pending stall during admin review (includes dishes). */
export async function getAdminStallMenu(stallId: number): Promise<StallMenuResponse> {
  return loadStallMenuSafe(
    stallId,
    "status = 'pending'",
    "getAdminStallMenu"
  );
}
