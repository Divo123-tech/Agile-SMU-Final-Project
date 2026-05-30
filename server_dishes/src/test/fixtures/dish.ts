import type { CreateDishInput, DishResponse } from "../../types/dish";
import type { DishRow } from "../../types/dish";

export const dishRow: DishRow = {
  dish_id: 42,
  stall_id: 101,
  dish_name: "Crispy Spring Rolls",
  description: "Served with sweet chili sauce",
  allergens: "gluten, soy",
  category: "Appetizers",
};

export const dishResponse: DishResponse = {
  id: "42",
  stallId: 101,
  name: "Crispy Spring Rolls",
  description: "Served with sweet chili sauce",
  allergens: ["gluten", "soy"],
  category: "Appetizers",
};

export const createDishBody: CreateDishInput = {
  stallId: 101,
  name: "Crispy Spring Rolls",
  description: "Served with sweet chili sauce",
  allergens: ["gluten", "soy"],
  category: "Appetizers",
};

export const updateDishBody = {
  name: "Updated Spring Rolls",
  description: "New description",
  allergens: ["soy"],
  category: "Sides",
};

export const editDishBody = {
  name: "Pad Thai",
  description: "Updated noodles",
  allergens: ["soy"],
};
