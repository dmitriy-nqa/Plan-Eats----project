import { dishCategoryValues, type DishCategory } from "@/lib/dishes";

export const dishCategories = dishCategoryValues;

export const ingredientUnits = ["g", "ml", "l", "pcs"] as const;

export type DishCategoryOption = DishCategory;
export type IngredientUnit = (typeof ingredientUnits)[number];

export type DishIngredientDraft = {
  id: string;
  name: string;
  quantity: string;
  unit: IngredientUnit;
};

export type DishFormValues = {
  name: string;
  category: DishCategoryOption;
  comment: string;
  recipeText: string;
  ingredients: DishIngredientDraft[];
};

export function createEmptyIngredient(id: string): DishIngredientDraft {
  return {
    id,
    name: "",
    quantity: "",
    unit: "g",
  };
}

export const addDishDraft: DishFormValues = {
  name: "",
  category: "main_course",
  comment: "",
  recipeText: "",
  ingredients: [createEmptyIngredient("ingredient-1")],
};

export const editDishDraft: DishFormValues = {
  name: "Tomato soup",
  category: "soup",
  comment: "Easy batch cooking for two lunches.",
  recipeText:
    "Saute onion with a little oil, add tomatoes, simmer, blend if needed, and finish with herbs.",
  ingredients: [
    { id: "ingredient-1", name: "Tomatoes", quantity: "800", unit: "g" },
    { id: "ingredient-2", name: "Onion", quantity: "2", unit: "pcs" },
    { id: "ingredient-3", name: "Garlic", quantity: "3", unit: "pcs" },
  ],
};
