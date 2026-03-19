import "server-only";

import {
  buildWeeklyMenuView,
  getCurrentWeekRange,
  isMealType,
  type MealType,
  type WeeklyMenuSlotDishDetails,
  type WeeklyMenuSlotRecord,
  type WeeklyMenuView,
} from "@/lib/weekly-menu";
import type { DishCategory } from "@/lib/dishes";
import type { IngredientUnit } from "@/lib/dish-form";
import type { AppLocale } from "@/lib/i18n/config";
import { getTranslation } from "@/lib/i18n/translate";
import { getCurrentFamilyId, getSupabaseServerClient } from "@/lib/supabase/server";

type MealPlanRow = {
  id: string;
  start_date: string;
  end_date: string;
};

type MealPlanSlotRow = {
  id: string;
  day_index: number;
  meal_type: MealType;
  dish_id: string;
};

type DishNameRow = {
  id: string;
  name: string;
  category: DishCategory;
  comment: string | null;
  recipe_text: string | null;
  is_archived: boolean;
};

type DishIngredientRow = {
  id: string;
  dish_id: string;
  ingredient_name: string;
  quantity: number | string;
  unit: IngredientUnit;
  sort_order: number | null;
};

function assertDayIndex(dayIndex: number) {
  if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) {
    throw new Error(`Invalid day index: ${dayIndex}`);
  }
}

function assertMealType(mealType: string): MealType {
  if (!isMealType(mealType)) {
    throw new Error(`Invalid meal type: ${mealType}`);
  }

  return mealType;
}

function formatQuantity(value: number | string) {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(numericValue)) {
    return "";
  }

  return `${numericValue}`;
}

async function fetchCurrentWeekMealPlan() {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();
  const weekRange = getCurrentWeekRange();

  const { data, error } = await supabase
    .from("meal_plans")
    .select("id, start_date, end_date")
    .eq("family_id", familyId)
    .eq("start_date", weekRange.startDate)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    familyId,
    weekRange,
    mealPlan: (data ?? null) as MealPlanRow | null,
  };
}

async function ensureCurrentWeekMealPlan() {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();
  const weekRange = getCurrentWeekRange();

  const { data: existingMealPlan, error: existingError } = await supabase
    .from("meal_plans")
    .select("id, start_date, end_date")
    .eq("family_id", familyId)
    .eq("start_date", weekRange.startDate)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingMealPlan) {
    return {
      familyId,
      weekRange,
      mealPlan: existingMealPlan as MealPlanRow,
    };
  }

  const { data: createdMealPlan, error: createError } = await supabase
    .from("meal_plans")
    .insert({
      family_id: familyId,
      start_date: weekRange.startDate,
      end_date: weekRange.endDate,
    })
    .select("id, start_date, end_date")
    .single();

  if (!createError) {
    return {
      familyId,
      weekRange,
      mealPlan: createdMealPlan as MealPlanRow,
    };
  }

  if (createError.code !== "23505") {
    throw createError;
  }

  const { data: retriedMealPlan, error: retryError } = await supabase
    .from("meal_plans")
    .select("id, start_date, end_date")
    .eq("family_id", familyId)
    .eq("start_date", weekRange.startDate)
    .single();

  if (retryError) {
    throw retryError;
  }

  return {
    familyId,
    weekRange,
    mealPlan: retriedMealPlan as MealPlanRow,
  };
}

export async function fetchCurrentWeekMenu(
  locale: AppLocale = "en",
): Promise<WeeklyMenuView> {
  const supabase = getSupabaseServerClient();
  const { weekRange, mealPlan } = await fetchCurrentWeekMealPlan();

  if (!mealPlan) {
    return buildWeeklyMenuView({
      weekRange,
      slots: [],
      locale,
    });
  }

  const { data: slotRows, error: slotsError } = await supabase
    .from("meal_plan_slots")
    .select("id, day_index, meal_type, dish_id")
    .eq("meal_plan_id", mealPlan.id)
    .order("day_index", { ascending: true });

  if (slotsError) {
    throw slotsError;
  }

  const normalizedSlots = ((slotRows ?? []) as MealPlanSlotRow[]).map((slot) => ({
    id: slot.id,
    dayIndex: slot.day_index,
    mealType: assertMealType(slot.meal_type),
    dishId: slot.dish_id,
  }));

  const dishIds = [...new Set(normalizedSlots.map((slot) => slot.dishId))];
  const dishMap = new Map<string, DishNameRow>();

  if (dishIds.length > 0) {
    const { data: dishRows, error: dishesError } = await supabase
      .from("dishes")
      .select("id, name, category, comment, recipe_text, is_archived")
      .in("id", dishIds);

    if (dishesError) {
      throw dishesError;
    }

    for (const dish of (dishRows ?? []) as DishNameRow[]) {
      dishMap.set(dish.id, dish);
    }
  }

  const dishDetailsMap = new Map<string, WeeklyMenuSlotDishDetails>();

  if (dishIds.length > 0) {
    const { data: ingredientRows, error: ingredientsError } = await supabase
      .from("dish_ingredients")
      .select("id, dish_id, ingredient_name, quantity, unit, sort_order")
      .in("dish_id", dishIds)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (ingredientsError) {
      throw ingredientsError;
    }

    const ingredientsByDishId = new Map<string, WeeklyMenuSlotDishDetails["ingredients"]>();

    for (const ingredient of (ingredientRows ?? []) as DishIngredientRow[]) {
      const ingredients = ingredientsByDishId.get(ingredient.dish_id) ?? [];
      ingredients.push({
        id: ingredient.id,
        name: ingredient.ingredient_name,
        quantity: formatQuantity(ingredient.quantity),
        unit: ingredient.unit,
      });
      ingredientsByDishId.set(ingredient.dish_id, ingredients);
    }

    for (const dishId of dishIds) {
      const dish = dishMap.get(dishId);

      if (!dish) {
        continue;
      }

      dishDetailsMap.set(dishId, {
        id: dish.id,
        name: dish.name,
        category: dish.category,
        comment: dish.comment ?? undefined,
        recipeText: dish.recipe_text ?? undefined,
        ingredients: ingredientsByDishId.get(dishId) ?? [],
        isArchived: dish.is_archived,
      });
    }
  }

  const slots: WeeklyMenuSlotRecord[] = normalizedSlots.map((slot) => {
    const dish = dishMap.get(slot.dishId);

    return {
      dayIndex: slot.dayIndex,
      mealType: slot.mealType,
      dishId: slot.dishId,
      dishName: dish?.name ?? getTranslation(locale, "weeklyMenu.status.unavailableDish"),
      isArchivedDish: dish?.is_archived ?? false,
      dishDetails: dishDetailsMap.get(slot.dishId),
    };
  });

  return buildWeeklyMenuView({
    weekRange,
    mealPlanId: mealPlan.id,
    slots,
    locale,
  });
}

export async function assignDishToCurrentWeekSlot({
  dayIndex,
  mealType,
  dishId,
}: {
  dayIndex: number;
  mealType: string;
  dishId: string;
}) {
  assertDayIndex(dayIndex);
  const normalizedMealType = assertMealType(mealType);

  if (!dishId) {
    throw new Error("Missing dish id for slot assignment");
  }

  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();

  const { data: dish, error: dishError } = await supabase
    .from("dishes")
    .select("id")
    .eq("id", dishId)
    .eq("family_id", familyId)
    .eq("is_archived", false)
    .maybeSingle();

  if (dishError) {
    throw dishError;
  }

  if (!dish) {
    throw new Error("Dish not found or archived");
  }

  const { mealPlan } = await ensureCurrentWeekMealPlan();

  const { error: slotError } = await supabase.from("meal_plan_slots").upsert(
    {
      family_id: familyId,
      meal_plan_id: mealPlan.id,
      day_index: dayIndex,
      meal_type: normalizedMealType,
      dish_id: dishId,
    },
    {
      onConflict: "meal_plan_id,day_index,meal_type",
    },
  );

  if (slotError) {
    throw slotError;
  }

  try {
    const {
      markShoppingListSourceChangedByMealPlanId,
      syncShoppingListByMealPlanId,
    } = await import("@/lib/shopping-list-crud");

    await markShoppingListSourceChangedByMealPlanId(mealPlan.id);
    await syncShoppingListByMealPlanId(mealPlan.id, {
      type: "slots",
      slots: [
        {
          dayIndex,
          mealType: normalizedMealType,
        },
      ],
    });
  } catch (error) {
    console.error("Failed to sync shopping list after slot assignment", error);
  }
}

export async function clearCurrentWeekSlot({
  dayIndex,
  mealType,
}: {
  dayIndex: number;
  mealType: string;
}) {
  assertDayIndex(dayIndex);
  const normalizedMealType = assertMealType(mealType);

  const supabase = getSupabaseServerClient();
  const { mealPlan } = await fetchCurrentWeekMealPlan();

  if (!mealPlan) {
    return;
  }

  const { error } = await supabase
    .from("meal_plan_slots")
    .delete()
    .eq("meal_plan_id", mealPlan.id)
    .eq("day_index", dayIndex)
    .eq("meal_type", normalizedMealType);

  if (error) {
    throw error;
  }

  try {
    const {
      markShoppingListSourceChangedByMealPlanId,
      syncShoppingListByMealPlanId,
    } = await import("@/lib/shopping-list-crud");

    await markShoppingListSourceChangedByMealPlanId(mealPlan.id);
    await syncShoppingListByMealPlanId(mealPlan.id, {
      type: "slots",
      slots: [
        {
          dayIndex,
          mealType: normalizedMealType,
        },
      ],
    });
  } catch (syncError) {
    console.error("Failed to sync shopping list after slot clear", syncError);
  }
}
