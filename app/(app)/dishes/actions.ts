"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  dishCategories,
  ingredientUnits,
  type DishCategoryOption,
  type DishFormSubmissionState,
  type DishFormValues,
  type IngredientUnit,
  initialDishFormSubmissionState,
  validateDishFormValues,
} from "@/lib/dish-form";
import { getDishLibraryHref, parseDishLibraryMode } from "@/lib/dishes";
import type { AppLocale } from "@/lib/i18n/config";
import { getTranslation } from "@/lib/i18n/translate";

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

function readLocale(formData: FormData): AppLocale {
  return readText(formData, "locale") === "ru" ? "ru" : "en";
}

function parseDishFormData(formData: FormData) {
  const ingredientNames = formData.getAll("ingredientName").map((value) => String(value));
  const ingredientQuantities = formData.getAll("ingredientQuantity").map((value) => String(value));
  const ingredientUnitValues = formData.getAll("ingredientUnit").map((value) => String(value));
  const ingredientProductIds = formData.getAll("ingredientProductId").map((value) => String(value));
  const categoryValue = readText(formData, "category");
  const category = isDishCategory(categoryValue) ? categoryValue : "main_course";

  const ingredients = ingredientNames.map((name, index) => {
    const unitValue = ingredientUnitValues[index] ?? "g";

    return {
      id: `ingredient-${index + 1}`,
      name,
      quantity: ingredientQuantities[index] ?? "",
      unit: isIngredientUnit(unitValue) ? unitValue : "g",
      productId: ingredientProductIds[index]?.trim() || null,
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

function buildValidationState(
  locale: AppLocale,
  values: DishFormValues,
): DishFormSubmissionState {
  const issues = validateDishFormValues(values);

  if (issues.length === 0) {
    return initialDishFormSubmissionState;
  }

  const ingredientRows: Record<number, string> = {};
  let nameError: string | undefined;

  for (const issue of issues) {
    if (issue.code === "name_required") {
      nameError = getTranslation(locale, "dishes.form.validation.nameRequired");
      continue;
    }

    ingredientRows[issue.rowIndex] =
      issue.code === "ingredient_incomplete"
        ? getTranslation(locale, "dishes.form.validation.ingredientIncomplete", {
            row: issue.rowIndex + 1,
          })
        : getTranslation(locale, "dishes.form.validation.ingredientQuantityInvalid", {
            row: issue.rowIndex + 1,
          });
  }

  return {
    status: "error",
    formError: getTranslation(locale, "dishes.form.validation.fixErrors"),
    fieldErrors: {
      name: nameError,
      ingredientRows,
    },
  };
}

function buildSaveFailedState(locale: AppLocale): DishFormSubmissionState {
  return {
    status: "error",
    formError: getTranslation(locale, "dishes.form.validation.saveFailed"),
    fieldErrors: {
      ingredientRows: {},
    },
  };
}

export async function createDishAction(
  _previousState: DishFormSubmissionState,
  formData: FormData,
): Promise<DishFormSubmissionState> {
  const { createDishWithIngredients } = await import("@/lib/dish-crud");
  const locale = readLocale(formData);
  const values = parseDishFormData(formData);
  const validationState = buildValidationState(locale, values);

  if (validationState.status === "error") {
    return validationState;
  }

  try {
    await createDishWithIngredients(values);
  } catch (error) {
    console.error("Failed to create dish", error);
    return buildSaveFailedState(locale);
  }

  revalidatePath("/dishes");
  redirect("/dishes");
}

export async function updateDishAction(
  _previousState: DishFormSubmissionState,
  formData: FormData,
): Promise<DishFormSubmissionState> {
  const { updateDishWithIngredients } = await import("@/lib/dish-crud");
  const dishId = readText(formData, "dishId");
  const locale = readLocale(formData);
  const mode = parseDishLibraryMode(readText(formData, "mode") || undefined);

  if (!dishId) {
    return buildSaveFailedState(locale);
  }

  const values = parseDishFormData(formData);
  const validationState = buildValidationState(locale, values);

  if (validationState.status === "error") {
    return validationState;
  }

  try {
    await updateDishWithIngredients(dishId, values);
  } catch (error) {
    console.error("Failed to update dish", error);
    return buildSaveFailedState(locale);
  }

  revalidatePath("/dishes");
  revalidatePath(`/dishes/${dishId}`);
  revalidatePath(`/dishes/${dishId}/edit`);
  revalidatePath("/products");
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
  revalidatePath("/products");
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
  revalidatePath("/products");
  redirect(getDishLibraryHref("active"));
}
