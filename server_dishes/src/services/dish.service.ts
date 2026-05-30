import { pool } from "../db";
import { NotFoundError, ServiceError } from "../errors";
import type { CreateDishInput, DishResponse, UpdateDishInput } from "../types/dish";
import type { DishRow } from "../types/dish";

function dishRowToResponse(row: DishRow): DishResponse {
  return {
    id: String(row.dish_id),
    stallId: row.stall_id,
    name: row.dish_name,
    description: row.description ?? "",
    allergens: row.allergens
      ? row.allergens.split(",").map((a) => a.trim()).filter(Boolean)
      : [],
    category: row.category?.trim() || "Other",
  };
}

async function stallExists(stallId: number): Promise<boolean> {
  const { rows } = await pool.query<{ id: number }>(
    "SELECT id FROM stalls WHERE id = $1 LIMIT 1",
    [stallId]
  );
  return rows.length > 0;
}

async function touchStallUpdatedAt(stallId: number): Promise<void> {
  await pool.query(`UPDATE stalls SET updated_at = NOW() WHERE id = $1`, [stallId]);
}

export async function getDishById(dishId: number): Promise<DishResponse> {
  try {
    const { rows } = await pool.query<DishRow>(
      "SELECT * FROM dishes WHERE dish_id = $1 LIMIT 1",
      [dishId]
    );

    if (rows.length === 0) {
      throw new NotFoundError(`Dish with id ${dishId} was not found`);
    }

    return dishRowToResponse(rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }

    console.error(`getDishById failed for dishId=${dishId}:`, err);
    throw new ServiceError("Unable to load dish. Please try again later.");
  }
}

export async function updateDish(
  dishId: number,
  input: UpdateDishInput
): Promise<DishResponse> {
  const allergensValue =
    input.allergens.length > 0 ? input.allergens.join(", ") : null;

  try {
    const existing = await pool.query<DishRow>(
      "SELECT * FROM dishes WHERE dish_id = $1 LIMIT 1",
      [dishId]
    );

    if (existing.rows.length === 0) {
      throw new NotFoundError(`Dish with id ${dishId} was not found`);
    }

    const current = existing.rows[0];
    const stallId = input.stallId ?? current.stall_id;

    if (input.stallId !== undefined) {
      const exists = await stallExists(input.stallId);
      if (!exists) {
        throw new NotFoundError(`Stall with id ${input.stallId} was not found`);
      }
    }

    const category = input.category?.trim() || current.category?.trim() || "Other";

    const { rows } = await pool.query<DishRow>(
      `UPDATE dishes
       SET stall_id = $1, dish_name = $2, description = $3, allergens = $4, category = $5
       WHERE dish_id = $6
       RETURNING *`,
      [stallId, input.name, input.description, allergensValue, category, dishId]
    );

    await touchStallUpdatedAt(stallId);
    if (input.stallId !== undefined && input.stallId !== current.stall_id) {
      await touchStallUpdatedAt(current.stall_id);
    }

    return dishRowToResponse(rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }

    console.error(`updateDish failed for dishId=${dishId}:`, err);
    throw new ServiceError("Unable to update dish. Please try again later.");
  }
}

export async function deleteDish(dishId: number): Promise<DishResponse> {
  try {
    const { rows } = await pool.query<DishRow>(
      "DELETE FROM dishes WHERE dish_id = $1 RETURNING *",
      [dishId]
    );

    if (rows.length === 0) {
      throw new NotFoundError(`Dish with id ${dishId} was not found`);
    }

    await touchStallUpdatedAt(rows[0].stall_id);

    return dishRowToResponse(rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }

    console.error(`deleteDish failed for dishId=${dishId}:`, err);
    throw new ServiceError("Unable to delete dish. Please try again later.");
  }
}

export async function createDish(input: CreateDishInput): Promise<DishResponse> {
  const category = input.category?.trim() || "Other";
  const allergensValue =
    input.allergens.length > 0 ? input.allergens.join(", ") : null;

  try {
    const exists = await stallExists(input.stallId);
    if (!exists) {
      throw new NotFoundError(`Stall with id ${input.stallId} was not found`);
    }

    const { rows } = await pool.query<DishRow>(
      `INSERT INTO dishes (stall_id, dish_name, description, allergens, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.stallId, input.name, input.description, allergensValue, category]
    );

    await touchStallUpdatedAt(input.stallId);

    return dishRowToResponse(rows[0]);
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }

    console.error(`createDish failed for stallId=${input.stallId}:`, err);
    throw new ServiceError("Unable to create dish. Please try again later.");
  }
}
