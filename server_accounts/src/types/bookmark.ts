export type BookmarkStallOption = {
  id: number;
  name: string;
};

export type BookmarkedDish = {
  id: string;
  stallId: number;
  stallName: string;
  name: string;
  description: string;
  allergens: string[];
  category: string;
  savedAt: string;
};

export type MyDishesResponse = {
  stalls: BookmarkStallOption[];
  dishes: BookmarkedDish[];
};

export type BookmarkRow = {
  account_id: number;
  dish_id: number;
  created_at: Date | string;
};

export type BookmarkedDishRow = {
  dish_id: number;
  stall_id: number;
  dish_name: string;
  description: string | null;
  allergens: string | null;
  category: string | null;
  stall_name: string;
  created_at: Date | string;
};
