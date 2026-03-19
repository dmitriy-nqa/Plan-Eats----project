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
  productId: string | null;
  linkedProductName?: string;
  linkedProductIsArchived?: boolean;
};

export type DishFormValues = {
  name: string;
  category: DishCategoryOption;
  comment: string;
  recipeText: string;
  ingredients: DishIngredientDraft[];
};

export type DishIngredientWrite = {
  ingredient_name: string;
  quantity: number;
  unit: IngredientUnit;
  sort_order: number;
  product_id: string | null;
};

export type DishFormValidationIssue =
  | { code: "name_required" }
  | { code: "ingredient_incomplete"; rowIndex: number }
  | { code: "ingredient_quantity_invalid"; rowIndex: number };

export type DishFormSubmissionState = {
  status: "idle" | "error";
  formError?: string;
  fieldErrors: {
    name?: string;
    ingredientRows: Record<number, string>;
  };
};

export const initialDishFormSubmissionState: DishFormSubmissionState = {
  status: "idle",
  fieldErrors: {
    ingredientRows: {},
  },
};

export function createEmptyIngredient(id: string): DishIngredientDraft {
  return {
    id,
    name: "",
    quantity: "",
    unit: "g",
    productId: null,
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
    {
      id: "ingredient-1",
      name: "Tomatoes",
      quantity: "800",
      unit: "g",
      productId: null,
    },
    { id: "ingredient-2", name: "Onion", quantity: "2", unit: "pcs", productId: null },
    { id: "ingredient-3", name: "Garlic", quantity: "3", unit: "pcs", productId: null },
  ],
};

function normalizeIngredientDraft(ingredient: DishIngredientDraft) {
  const name = ingredient.name.trim();
  const quantityText = ingredient.quantity.trim().replace(",", ".");
  const quantity = Number(quantityText);

  return {
    name,
    quantityText,
    quantity,
    unit: ingredientUnits.includes(ingredient.unit) ? ingredient.unit : "g",
  };
}

export function validateDishFormValues(values: DishFormValues): DishFormValidationIssue[] {
  const issues: DishFormValidationIssue[] = [];

  if (!values.name.trim()) {
    issues.push({ code: "name_required" });
  }

  values.ingredients.forEach((ingredient, rowIndex) => {
    const normalizedIngredient = normalizeIngredientDraft(ingredient);
    const hasName = normalizedIngredient.name.length > 0;
    const hasQuantity = normalizedIngredient.quantityText.length > 0;

    if (!hasName && !hasQuantity) {
      return;
    }

    if (!hasName || !hasQuantity) {
      issues.push({ code: "ingredient_incomplete", rowIndex });
      return;
    }

    if (
      Number.isNaN(normalizedIngredient.quantity) ||
      normalizedIngredient.quantity <= 0
    ) {
      issues.push({ code: "ingredient_quantity_invalid", rowIndex });
    }
  });

  return issues;
}

export function normalizeIngredientsForWrite(values: DishFormValues): DishIngredientWrite[] {
  return values.ingredients.flatMap((ingredient, index) => {
    const normalizedIngredient = normalizeIngredientDraft(ingredient);
    const isEmptyRow =
      !normalizedIngredient.name && !normalizedIngredient.quantityText;

    if (isEmptyRow) {
      return [];
    }

    if (
      !normalizedIngredient.name ||
      !normalizedIngredient.quantityText ||
      Number.isNaN(normalizedIngredient.quantity) ||
      normalizedIngredient.quantity <= 0
    ) {
      return [];
    }

    return [
      {
        ingredient_name: normalizedIngredient.name,
        quantity: normalizedIngredient.quantity,
        unit: normalizedIngredient.unit,
        sort_order: index,
        product_id: ingredient.productId?.trim() || null,
      },
    ];
  });
}
