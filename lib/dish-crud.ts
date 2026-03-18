import "server-only";

import type { DishFormValues, IngredientUnit } from "@/lib/dish-form";
import {
  getDishDerivedSummary,
  type DishCategory,
  type DishLibraryMode,
  type DishSummary,
} from "@/lib/dishes";
import type { AppLocale, TranslationKey } from "@/lib/i18n/config";
import { getTranslation } from "@/lib/i18n/translate";
import { getCurrentFamilyId, getSupabaseServerClient } from "@/lib/supabase/server";

const allowedUnits = new Set<IngredientUnit>(["g", "ml", "l", "pcs"]);

type DishRow = {
  id: string;
  name: string;
  category: DishCategory;
  comment: string | null;
  recipe_text: string | null;
};

type DishDetailsRow = DishRow & {
  is_archived: boolean;
};

type DishIngredientRow = {
  id: string;
  ingredient_name: string;
  quantity: number | string;
  unit: IngredientUnit;
  sort_order: number | null;
};

export type DishDetails = DishFormValues & {
  id: string;
  isArchived: boolean;
};

function formatQuantity(value: number | string) {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(numericValue)) {
    return "";
  }

  return `${numericValue}`;
}

function normalizeIngredientsForWrite(values: DishFormValues) {
  return values.ingredients
    .map((ingredient, index) => {
      const ingredientName = ingredient.name.trim();
      const quantityText = ingredient.quantity.trim().replace(",", ".");
      const quantity = Number(quantityText);
      const unit = allowedUnits.has(ingredient.unit) ? ingredient.unit : "g";

      if (!ingredientName || !quantityText || Number.isNaN(quantity) || quantity <= 0) {
        return null;
      }

      return {
        ingredient_name: ingredientName,
        quantity,
        unit,
        sort_order: index,
      };
    })
    .filter((ingredient): ingredient is NonNullable<typeof ingredient> => ingredient !== null);
}

export async function fetchActiveDishes(
  locale: AppLocale = "en",
  summaryPlaceholderKey: TranslationKey = "weeklyMenu.picker.summaryFallback",
) {
  return fetchDishesByMode("active", locale, summaryPlaceholderKey);
}

export async function fetchDishesByMode(
  mode: DishLibraryMode,
  locale: AppLocale = "en",
  summaryPlaceholderKey: TranslationKey = "dishes.summary.fallback",
) {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();

  const { data, error } = await supabase
    .from("dishes")
    .select("id, name, category, comment, recipe_text")
    .eq("family_id", familyId)
    .eq("is_archived", mode === "archived")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as DishRow[]).map((dish) => ({
    id: dish.id,
    name: dish.name,
    category: dish.category,
    summary: getDishDerivedSummary({
      comment: dish.comment,
      recipeText: dish.recipe_text,
      placeholder: getTranslation(locale, summaryPlaceholderKey),
    }),
  })) satisfies DishSummary[];
}

export async function fetchDishWithIngredients(dishId: string) {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();

  const { data: dish, error: dishError } = await supabase
    .from("dishes")
    .select("id, name, category, comment, recipe_text, is_archived")
    .eq("family_id", familyId)
    .eq("id", dishId)
    .maybeSingle();

  if (dishError) {
    throw dishError;
  }

  if (!dish) {
    return null;
  }

  const { data: ingredients, error: ingredientsError } = await supabase
    .from("dish_ingredients")
    .select("id, ingredient_name, quantity, unit, sort_order")
    .eq("dish_id", dishId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (ingredientsError) {
    throw ingredientsError;
  }

  const mappedIngredients = ((ingredients ?? []) as DishIngredientRow[]).map((ingredient, index) => ({
    id: ingredient.id || `ingredient-${index + 1}`,
    name: ingredient.ingredient_name,
    quantity: formatQuantity(ingredient.quantity),
    unit: ingredient.unit,
  }));

  const dishRecord = dish as DishDetailsRow;

  return {
    id: dishRecord.id,
    name: dishRecord.name,
    category: dishRecord.category,
    comment: dishRecord.comment ?? "",
    recipeText: dishRecord.recipe_text ?? "",
    ingredients: mappedIngredients,
    isArchived: dishRecord.is_archived,
  } satisfies DishDetails;
}

export async function createDishWithIngredients(values: DishFormValues) {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();

  const { data: createdDish, error: dishError } = await supabase
    .from("dishes")
    .insert({
      family_id: familyId,
      name: values.name.trim(),
      category: values.category,
      comment: values.comment.trim() || null,
      recipe_text: values.recipeText.trim() || null,
    })
    .select("id")
    .single();

  if (dishError) {
    throw dishError;
  }

  const ingredients = normalizeIngredientsForWrite(values);

  if (ingredients.length > 0) {
    const { error: ingredientsError } = await supabase.from("dish_ingredients").insert(
      ingredients.map((ingredient) => ({
        dish_id: createdDish.id,
        ingredient_name: ingredient.ingredient_name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        sort_order: ingredient.sort_order,
      })),
    );

    if (ingredientsError) {
      await supabase.from("dishes").delete().eq("id", createdDish.id);
      throw ingredientsError;
    }
  }

  return createdDish.id;
}

export async function updateDishWithIngredients(dishId: string, values: DishFormValues) {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();

  const { error: dishError } = await supabase
    .from("dishes")
    .update({
      name: values.name.trim(),
      category: values.category,
      comment: values.comment.trim() || null,
      recipe_text: values.recipeText.trim() || null,
    })
    .eq("id", dishId)
    .eq("family_id", familyId);

  if (dishError) {
    throw dishError;
  }

  const { error: deleteIngredientsError } = await supabase
    .from("dish_ingredients")
    .delete()
    .eq("dish_id", dishId);

  if (deleteIngredientsError) {
    throw deleteIngredientsError;
  }

  const ingredients = normalizeIngredientsForWrite(values);

  if (ingredients.length === 0) {
    return;
  }

  const { error: insertIngredientsError } = await supabase.from("dish_ingredients").insert(
    ingredients.map((ingredient) => ({
      dish_id: dishId,
      ingredient_name: ingredient.ingredient_name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      sort_order: ingredient.sort_order,
    })),
  );

  if (insertIngredientsError) {
    throw insertIngredientsError;
  }
}

export async function archiveDish(dishId: string) {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();

  const { error } = await supabase
    .from("dishes")
    .update({ is_archived: true })
    .eq("id", dishId)
    .eq("family_id", familyId);

  if (error) {
    throw error;
  }
}

export async function restoreDish(dishId: string) {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();

  const { error } = await supabase
    .from("dishes")
    .update({ is_archived: false })
    .eq("id", dishId)
    .eq("family_id", familyId);

  if (error) {
    throw error;
  }
}
