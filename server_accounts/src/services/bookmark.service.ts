import { pool } from "../db";
import {
  NotFoundError,
  ServiceError,
  ValidationError,
} from "../errors";
import type {
  BookmarkedDish,
  BookmarkedDishRow,
  MyDishesResponse,
} from "../types/bookmark";

function mapDishRow(row: BookmarkedDishRow): BookmarkedDish {
  return {
    id: String(row.dish_id),
    stallId: row.stall_id,
    stallName: row.stall_name,
    name: row.dish_name,
    description: row.description ?? "",
    allergens: row.allergens
      ? row.allergens.split(",").map((a) => a.trim()).filter(Boolean)
      : [],
    category: row.category?.trim() || "Other",
    savedAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

const LIST_BOOKMARKS_SQL = `
  SELECT
    d.dish_id,
    d.stall_id,
    d.dish_name,
    d.description,
    d.allergens,
    d.category,
    s.name AS stall_name,
    b.created_at
  FROM bookmarked_dishes b
  INNER JOIN dishes d ON d.dish_id = b.dish_id
  INNER JOIN stalls s ON s.id = d.stall_id
  WHERE b.account_id = $1
  ORDER BY b.created_at DESC
`;

export async function listBookmarkedDishes(
  accountId: number
): Promise<MyDishesResponse> {
  try {
    const { rows } = await pool.query<BookmarkedDishRow>(LIST_BOOKMARKS_SQL, [
      accountId,
    ]);

    const dishes = rows.map(mapDishRow);
    const stallMap = new Map<number, string>();

    for (const dish of dishes) {
      if (!stallMap.has(dish.stallId)) {
        stallMap.set(dish.stallId, dish.stallName);
      }
    }

    const stalls = [...stallMap.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { stalls, dishes };
  } catch (err) {
    console.error(`listBookmarkedDishes failed for account=${accountId}:`, err);
    throw new ServiceError(
      "Unable to load saved dishes. Please try again later."
    );
  }
}

async function dishExists(dishId: number): Promise<boolean> {
  const { rows } = await pool.query<{ dish_id: number }>(
    "SELECT dish_id FROM dishes WHERE dish_id = $1 LIMIT 1",
    [dishId]
  );
  return rows.length > 0;
}

export async function addBookmark(
  accountId: number,
  dishId: number
): Promise<BookmarkedDish> {
  if (!Number.isInteger(dishId) || dishId <= 0) {
    throw new ValidationError("dishId must be a positive integer");
  }

  try {
    if (!(await dishExists(dishId))) {
      throw new NotFoundError("Dish not found");
    }

    await pool.query(
      `INSERT INTO bookmarked_dishes (account_id, dish_id)
       VALUES ($1, $2)
       ON CONFLICT (account_id, dish_id) DO NOTHING`,
      [accountId, dishId]
    );

    const { rows } = await pool.query<BookmarkedDishRow>(
      `${LIST_BOOKMARKS_SQL.replace("WHERE b.account_id = $1", "WHERE b.account_id = $1 AND b.dish_id = $2")}`,
      [accountId, dishId]
    );

    if (rows.length === 0) {
      throw new NotFoundError("Dish not found");
    }

    return mapDishRow(rows[0]);
  } catch (err) {
    if (err instanceof ValidationError || err instanceof NotFoundError) {
      throw err;
    }

    console.error(
      `addBookmark failed for account=${accountId} dish=${dishId}:`,
      err
    );
    throw new ServiceError("Unable to save dish. Please try again later.");
  }
}

export async function removeBookmark(
  accountId: number,
  dishId: number
): Promise<void> {
  if (!Number.isInteger(dishId) || dishId <= 0) {
    throw new ValidationError("dishId must be a positive integer");
  }

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM bookmarked_dishes
       WHERE account_id = $1 AND dish_id = $2`,
      [accountId, dishId]
    );

    if (rowCount === 0) {
      throw new NotFoundError("Saved dish not found");
    }
  } catch (err) {
    if (err instanceof ValidationError || err instanceof NotFoundError) {
      throw err;
    }

    console.error(
      `removeBookmark failed for account=${accountId} dish=${dishId}:`,
      err
    );
    throw new ServiceError("Unable to remove saved dish. Please try again later.");
  }
}
