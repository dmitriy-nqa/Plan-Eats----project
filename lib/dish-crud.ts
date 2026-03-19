import "server-only";

import {
  normalizeIngredientsForWrite,
  type DishFormValues,
  type DishIngredientWrite,
  type IngredientUnit,
} from "@/lib/dish-form";
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
  product_id: string | null;
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

async function syncShoppingListsForDishSafely(dishId: string, reason: string) {
  try {
    const { syncShoppingListsForDish } = await import("@/lib/shopping-list-crud");
    await syncShoppingListsForDish(dishId);
  } catch (error) {
    console.error(`Failed to sync shopping lists after ${reason}`, error);
  }
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
    .select("id, ingredient_name, quantity, unit, sort_order, product_id")
    .eq("dish_id", dishId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (ingredientsError) {
    throw ingredientsError;
  }

  const ingredientRows = (ingredients ?? []) as DishIngredientRow[];
  const linkedProductIds = ingredientRows
    .map((ingredient) => ingredient.product_id)
    .filter((productId): productId is string => Boolean(productId));
  const linkedProductMap = new Map<
    string,
    {
      display_name: string;
      is_archived: boolean;
    }
  >();

  if (linkedProductIds.length > 0) {
    const { data: linkedProducts, error: linkedProductsError } = await supabase
      .from("products")
      .select("id, display_name, is_archived")
      .in("id", [...new Set(linkedProductIds)]);

    if (linkedProductsError) {
      throw linkedProductsError;
    }

    for (const product of linkedProducts ?? []) {
      linkedProductMap.set(String(product.id), {
        display_name: String(product.display_name),
        is_archived: Boolean(product.is_archived),
      });
    }
  }

  const mappedIngredients = ingredientRows.map((ingredient, index) => {
    const linkedProduct = ingredient.product_id
      ? linkedProductMap.get(ingredient.product_id)
      : undefined;

    return {
      id: ingredient.id || `ingredient-${index + 1}`,
      name: ingredient.ingredient_name,
      quantity: formatQuantity(ingredient.quantity),
      unit: ingredient.unit,
      productId: ingredient.product_id,
      linkedProductName: linkedProduct?.display_name,
      linkedProductIsArchived: linkedProduct?.is_archived,
    };
  });

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
        product_id: ingredient.product_id,
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
  const nextIngredients = normalizeIngredientsForWrite(values);

  const { data: previousIngredientsData, error: previousIngredientsError } = await supabase
    .from("dish_ingredients")
    .select("ingredient_name, quantity, unit, sort_order, product_id")
    .eq("dish_id", dishId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (previousIngredientsError) {
    throw previousIngredientsError;
  }

  const previousIngredients = ((previousIngredientsData ?? []) as DishIngredientRow[]).map(
    (ingredient) =>
      ({
        ingredient_name: ingredient.ingredient_name,
        quantity: Number(ingredient.quantity),
        unit: allowedUnits.has(ingredient.unit) ? ingredient.unit : "g",
        sort_order: ingredient.sort_order ?? 0,
        product_id: ingredient.product_id,
      }) satisfies DishIngredientWrite,
  );

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

  if (nextIngredients.length === 0) {
    await syncShoppingListsForDishSafely(dishId, "dish ingredient reset");
    return;
  }

  const { error: insertIngredientsError } = await supabase.from("dish_ingredients").insert(
    nextIngredients.map((ingredient) => ({
      dish_id: dishId,
      ingredient_name: ingredient.ingredient_name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      sort_order: ingredient.sort_order,
      product_id: ingredient.product_id,
    })),
  );

  if (insertIngredientsError) {
    if (previousIngredients.length > 0) {
      await supabase.from("dish_ingredients").insert(
        previousIngredients.map((ingredient) => ({
          dish_id: dishId,
          ingredient_name: ingredient.ingredient_name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          sort_order: ingredient.sort_order,
          product_id: ingredient.product_id,
        })),
      );
    }

    throw insertIngredientsError;
  }

  await syncShoppingListsForDishSafely(dishId, "dish update");
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

  await syncShoppingListsForDishSafely(dishId, "dish archive");
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

  await syncShoppingListsForDishSafely(dishId, "dish restore");
}
