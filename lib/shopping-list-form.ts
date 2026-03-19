import { ingredientUnits, type IngredientUnit } from "@/lib/dish-form";

export const shoppingListUnits = ingredientUnits;

export type ShoppingListFormValues = {
  ingredientName: string;
  quantity: string;
  unit: IngredientUnit;
};

export type ShoppingListFormSubmissionState = {
  status: "idle" | "error";
  formError?: string;
  fieldErrors: {
    ingredientName?: string;
    quantity?: string;
  };
};

export const initialShoppingListFormSubmissionState: ShoppingListFormSubmissionState = {
  status: "idle",
  fieldErrors: {},
};

export const addShoppingListItemDraft: ShoppingListFormValues = {
  ingredientName: "",
  quantity: "",
  unit: "pcs",
};

export type ShoppingListFormValidationIssue =
  | { code: "ingredient_name_required" }
  | { code: "quantity_invalid" };

export function validateShoppingListFormValues(
  values: ShoppingListFormValues,
): ShoppingListFormValidationIssue[] {
  const issues: ShoppingListFormValidationIssue[] = [];
  const ingredientName = values.ingredientName.trim();
  const quantity = Number(values.quantity.trim().replace(",", "."));

  if (!ingredientName) {
    issues.push({ code: "ingredient_name_required" });
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    issues.push({ code: "quantity_invalid" });
  }

  return issues;
}

export function normalizeShoppingListFormValues(values: ShoppingListFormValues) {
  return {
    ingredientName: values.ingredientName.trim(),
    quantity: Number(values.quantity.trim().replace(",", ".")),
    unit: shoppingListUnits.includes(values.unit) ? values.unit : "pcs",
  };
}
