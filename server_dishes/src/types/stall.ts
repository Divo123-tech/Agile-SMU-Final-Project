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

export type StallRow = {
  stall_id?: number;
  id?: number;
  name?: string;
  description?: string | null;
  image_url?: string | null;
  address?: string | null;
};

export type StallOut = {
  name: string;
  description: string;
  image: string;
  address: string;
};

export type StallMenuResponse = {
  stall: StallOut | null;
  categories: CategoryGroup[];
};
