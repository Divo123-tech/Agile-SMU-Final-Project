export type DishRow = {
  dish_id: number;
  stall_id: number;
  dish_name: string;
  description: string | null;
  allergens: string | null;
  category: string | null;
  updated_at?: string;
};

export type CreateDishInput = {
  stallId: number;
  name: string;
  description: string;
  allergens: string[];
  category?: string;
};

export type UpdateDishInput = {
  name: string;
  description: string;
  allergens: string[];
  stallId?: number;
  category?: string;
};

export type DishResponse = {
  id: string;
  stallId: number;
  name: string;
  description: string;
  allergens: string[];
  category: string;
};

/** @deprecated Use DishResponse */
export type CreateDishResponse = DishResponse;
