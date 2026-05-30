export type DishRow = {
  dish_id: number;
  stall_id: number;
  dish_name: string;
  description: string | null;
  allergens: string | null;
  category: string | null;
  updated_at?: string;
};

export type DishOut = {
  id: string;
  name: string;
  description: string;
  allergens: string[];
};

export type CategoryGroup = {
  category: string;
  dishes: DishOut[];
};

export type StallMenuOut = {
  name: string;
  description: string;
  image: string;
  address: string;
  owner: number;
  updatedAt: string | null;
};

export type StallMenuResponse = {
  stall: StallMenuOut | null;
  categories: CategoryGroup[];
};
