import { pool } from "../db";
import { NotFoundError, ServiceError } from "../errors";
import type {
  CategoryGroup,
  DishOut,
  DishRow,
  StallMenuResponse,
  StallOut,
  StallRow,
} from "../types/stall";

function stallFromRow(row: StallRow | undefined): StallOut | null {
  if (!row) return null;
  const name = row.name;
  if (name == null || String(name).trim() === "") return null;
  return {
    name: String(name),
    description: row.description?.trim() ?? "",
    image: (row.image_url ?? "").trim(),
    address: row.address ?? "",
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

export async function getStallMenu(stallId: number): Promise<StallMenuResponse> {
  try {
    const [stallRes, dishRes] = await Promise.all([
      pool.query<StallRow>("SELECT * FROM stalls WHERE id = $1 LIMIT 1", [stallId]),
      pool.query<DishRow>("SELECT * FROM dishes WHERE stall_id = $1", [stallId]),
    ]);

    if (stallRes.rows.length === 0) {
      throw new NotFoundError(`Stall with id ${stallId} was not found`);
    }

    const stall = stallFromRow(stallRes.rows[0]);
    if (!stall) {
      throw new NotFoundError(`Stall with id ${stallId} was not found`);
    }

    return {
      stall,
      categories: groupDishesByCategory(dishRes.rows),
    };
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }

    console.error(`getStallMenu failed for stallId=${stallId}:`, err);
    throw new ServiceError("Unable to load stall menu. Please try again later.");
  }
}
