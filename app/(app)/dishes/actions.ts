"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  dishCategories,
  ingredientUnits,
  type DishCategoryOption,
  type DishFormValues,
  type IngredientUnit,
} from "@/lib/dish-form";
import { getDishLibraryHref, parseDishLibraryMode } from "@/lib/dishes";

function isDishCategory(value: string): value is DishCategoryOption {
  return dishCategories.includes(value as DishCategoryOption);
}

function isIngredientUnit(value: string): value is IngredientUnit {
  return ingredientUnits.includes(value as IngredientUnit);
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseDishFormData(formData: FormData) {
  const ingredientNames = formData.getAll("ingredientName").map((value) => String(value));
  const ingredientQuantities = formData.getAll("ingredientQuantity").map((value) => String(value));
  const ingredientUnitValues = formData.getAll("ingredientUnit").map((value) => String(value));
  const categoryValue = readText(formData, "category");
  const category = isDishCategory(categoryValue) ? categoryValue : "main_course";

  const ingredients = ingredientNames.map((name, index) => {
    const unitValue = ingredientUnitValues[index] ?? "g";

    return {
      id: `ingredient-${index + 1}`,
      name,
      quantity: ingredientQuantities[index] ?? "",
      unit: isIngredientUnit(unitValue) ? unitValue : "g",
    };
  });

  return {
    name: readText(formData, "name"),
    category,
    comment: readText(formData, "comment"),
    recipeText: readText(formData, "recipeText"),
    ingredients,
  } satisfies DishFormValues;
}

export async function createDishAction(formData: FormData) {
  const { createDishWithIngredients } = await import("@/lib/dish-crud");
  const values = parseDishFormData(formData);
  await createDishWithIngredients(values);
  revalidatePath("/dishes");
  redirect("/dishes");
}

export async function updateDishAction(formData: FormData) {
  const { updateDishWithIngredients } = await import("@/lib/dish-crud");
  const dishId = readText(formData, "dishId");
  const mode = parseDishLibraryMode(readText(formData, "mode") || undefined);

  if (!dishId) {
    throw new Error("Missing dish id for update");
  }

  const values = parseDishFormData(formData);
  await updateDishWithIngredients(dishId, values);
  revalidatePath("/dishes");
  revalidatePath(`/dishes/${dishId}`);
  revalidatePath(`/dishes/${dishId}/edit`);
  redirect(`/dishes/${dishId}?mode=${mode}`);
}

export async function archiveDishAction(formData: FormData) {
  const { archiveDish } = await import("@/lib/dish-crud");
  const dishId = readText(formData, "dishId");

  if (!dishId) {
    throw new Error("Missing dish id for archive");
  }

  await archiveDish(dishId);
  revalidatePath("/dishes");
  redirect(getDishLibraryHref("archived"));
}

export async function restoreDishAction(formData: FormData) {
  const { restoreDish } = await import("@/lib/dish-crud");
  const dishId = readText(formData, "dishId");

  if (!dishId) {
    throw new Error("Missing dish id for restore");
  }

  await restoreDish(dishId);
  revalidatePath("/dishes");
  revalidatePath(`/dishes/${dishId}`);
  revalidatePath(`/dishes/${dishId}/edit`);
  redirect(getDishLibraryHref("active"));
}
