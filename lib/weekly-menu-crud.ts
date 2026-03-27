import "server-only";

import type { DishCategory } from "@/lib/dishes";
import type { IngredientUnit } from "@/lib/dish-form";
import type { AppLocale } from "@/lib/i18n/config";
import { getTranslation } from "@/lib/i18n/translate";
import { getCurrentFamilyId, getSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildWeeklyMenuCompatibilitySlotRecordFromSingleDish,
  buildWeeklyMenuSlotRecord,
  getCurrentWeekRange,
  isMealType,
  WeeklyMenuMutationError,
  type MealType,
  type WeeklyMenuSlotDishDetails,
  type WeeklyMenuView,
  buildWeeklyMenuView,
} from "@/lib/weekly-menu";

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

type MealPlanSlotItemRow = {
  id: string;
  slot_id: string;
  dish_id: string;
  sort_order: number;
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

function sortSlotItemRows(items: MealPlanSlotItemRow[]) {
  return [...items].sort((left, right) => {
    if (left.sort_order !== right.sort_order) {
      return left.sort_order - right.sort_order;
    }

    return left.id.localeCompare(right.id);
  });
}

function isMissingSlotItemStorageError(error: {
  code?: string;
  message?: string;
} | null | undefined) {
  return (
    error?.code === "PGRST205" ||
    error?.message?.includes("meal_plan_slot_items") === true
  );
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

async function fetchCurrentWeekSlotRow(args: {
  mealPlanId: string;
  dayIndex: number;
  mealType: MealType;
}) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("meal_plan_slots")
    .select("id, day_index, meal_type, dish_id")
    .eq("meal_plan_id", args.mealPlanId)
    .eq("day_index", args.dayIndex)
    .eq("meal_type", args.mealType)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const slot = data as MealPlanSlotRow;

  return {
    id: slot.id,
    dayIndex: slot.day_index,
    mealType: assertMealType(slot.meal_type),
    dishId: slot.dish_id,
  };
}

async function createCurrentWeekSlotRow(args: {
  familyId: string;
  mealPlanId: string;
  dayIndex: number;
  mealType: MealType;
  dishId: string;
}) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("meal_plan_slots")
    .insert({
      family_id: args.familyId,
      meal_plan_id: args.mealPlanId,
      day_index: args.dayIndex,
      meal_type: args.mealType,
      dish_id: args.dishId,
    })
    .select("id, day_index, meal_type, dish_id")
    .single();

  if (!error) {
    const slot = data as MealPlanSlotRow;

    return {
      id: slot.id,
      dayIndex: slot.day_index,
      mealType: assertMealType(slot.meal_type),
      dishId: slot.dish_id,
    };
  }

  if (error.code !== "23505") {
    throw error;
  }

  const existingSlot = await fetchCurrentWeekSlotRow({
    mealPlanId: args.mealPlanId,
    dayIndex: args.dayIndex,
    mealType: args.mealType,
  });

  if (!existingSlot) {
    throw error;
  }

  return existingSlot;
}

async function fetchSlotItemRowsBySlotIds(slotIds: string[]) {
  if (slotIds.length === 0) {
    return new Map<string, MealPlanSlotItemRow[]>();
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("meal_plan_slot_items")
    .select("id, slot_id, dish_id, sort_order")
    .in("slot_id", slotIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingSlotItemStorageError(error)) {
      return null;
    }

    throw error;
  }

  const itemsBySlotId = new Map<string, MealPlanSlotItemRow[]>();

  for (const item of (data ?? []) as MealPlanSlotItemRow[]) {
    const slotItems = itemsBySlotId.get(item.slot_id) ?? [];
    slotItems.push(item);
    itemsBySlotId.set(item.slot_id, slotItems);
  }

  return itemsBySlotId;
}

async function fetchPersistedSlotItems(slotId: string) {
  const itemsBySlotId = await fetchSlotItemRowsBySlotIds([slotId]);

  if (!itemsBySlotId) {
    return null;
  }

  return sortSlotItemRows(itemsBySlotId.get(slotId) ?? []);
}

async function ensurePersistedSlotItemsForSlot(args: {
  familyId: string;
  slot: {
    id: string;
    dayIndex: number;
    mealType: MealType;
    dishId: string;
  };
}) {
  const existingItems = await fetchPersistedSlotItems(args.slot.id);

  if (!existingItems) {
    return null;
  }

  if (existingItems.length > 0) {
    return existingItems;
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("meal_plan_slot_items").insert({
    family_id: args.familyId,
    slot_id: args.slot.id,
    dish_id: args.slot.dishId,
    sort_order: 0,
  });

  if (error) {
    if (isMissingSlotItemStorageError(error)) {
      return null;
    }

    if (error.code !== "23505") {
      throw error;
    }
  }

  return fetchPersistedSlotItems(args.slot.id);
}

async function upsertLegacyCurrentWeekSlotDish(args: {
  familyId: string;
  mealPlanId: string;
  dayIndex: number;
  mealType: MealType;
  dishId: string;
}) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("meal_plan_slots").upsert(
    {
      family_id: args.familyId,
      meal_plan_id: args.mealPlanId,
      day_index: args.dayIndex,
      meal_type: args.mealType,
      dish_id: args.dishId,
    },
    {
      onConflict: "meal_plan_id,day_index,meal_type",
    },
  );

  if (error) {
    throw error;
  }
}

async function assertActiveDishAvailable(dishId: string) {
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
    throw new WeeklyMenuMutationError("dish_not_available");
  }
}

async function assertActiveDishesAvailable(dishIds: string[]) {
  const uniqueDishIds = [...new Set(dishIds)];

  for (const dishId of uniqueDishIds) {
    await assertActiveDishAvailable(dishId);
  }
}

async function updateSlotPrimaryDish(args: {
  slotId: string;
  dishId: string;
}) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("meal_plan_slots")
    .update({
      dish_id: args.dishId,
    })
    .eq("id", args.slotId);

  if (error) {
    throw error;
  }
}

async function insertSlotItems(args: {
  familyId: string;
  slotId: string;
  dishIds: string[];
}) {
  if (args.dishIds.length === 0) {
    return;
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("meal_plan_slot_items").insert(
    args.dishIds.map((dishId, index) => ({
      family_id: args.familyId,
      slot_id: args.slotId,
      dish_id: dishId,
      sort_order: index,
    })),
  );

  if (error) {
    if (error.code === "23505") {
      throw new WeeklyMenuMutationError("duplicate_dish_in_slot");
    }

    throw error;
  }
}

async function syncShoppingForSlot(args: {
  mealPlanId: string;
  dayIndex: number;
  mealType: MealType;
}) {
  try {
    const {
      markShoppingListSourceChangedByMealPlanId,
      syncShoppingListByMealPlanId,
    } = await import("@/lib/shopping-list-crud");

    const syncScope = {
      type: "slots" as const,
      slots: [
        {
          dayIndex: args.dayIndex,
          mealType: args.mealType,
        },
      ],
    };

    await markShoppingListSourceChangedByMealPlanId(args.mealPlanId);
    await syncShoppingListByMealPlanId(args.mealPlanId, syncScope);
  } catch (error) {
    console.error("Failed to sync shopping list after weekly menu change", error);
  }
}

async function syncShoppingForMealPlan(args: {
  mealPlanId: string;
  expectedSourceSlots?: Array<{
    dayIndex: number;
    mealType: MealType;
    expectedDishIds: string[];
  }>;
}) {
  try {
    const {
      markShoppingListSourceChangedByMealPlanId,
      syncShoppingListByMealPlanId,
      waitForMealPlanSlotSourceVisibility,
    } = await import("@/lib/shopping-list-crud");

    const expectedSlotCount = args.expectedSourceSlots?.length ?? 0;
    const prefetchedSlots =
      args.expectedSourceSlots && args.expectedSourceSlots.length > 0
        ? await waitForMealPlanSlotSourceVisibility({
            mealPlanId: args.mealPlanId,
            targets: args.expectedSourceSlots ?? [],
          })
        : undefined;
    const syncScope =
      args.expectedSourceSlots && args.expectedSourceSlots.length > 0
        ? {
            type: "slots" as const,
            slots: args.expectedSourceSlots.map((slot) => ({
              dayIndex: slot.dayIndex,
              mealType: slot.mealType,
            })),
          }
        : {
            type: "full" as const,
          };

    await markShoppingListSourceChangedByMealPlanId(args.mealPlanId);
    await syncShoppingListByMealPlanId(args.mealPlanId, syncScope, {
      prefetchedSlots:
        expectedSlotCount > 0
          ? prefetchedSlots
          : undefined,
    });
  } catch (error) {
    console.error("Failed to fully sync shopping list after weekly menu reuse", error);
  }
}

async function fetchDishMaps(args: {
  dishIds: string[];
  locale: AppLocale;
}) {
  const supabase = getSupabaseServerClient();
  const dishIds = [...new Set(args.dishIds)];
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

  return {
    dishMap,
    dishDetailsMap,
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

  const itemsBySlotId = await fetchSlotItemRowsBySlotIds(
    normalizedSlots.map((slot) => slot.id),
  );
  const dishIds = [
    ...new Set(
      normalizedSlots.flatMap((slot) => {
        const persistedItems = itemsBySlotId?.get(slot.id) ?? [];

        if (persistedItems.length > 0) {
          return persistedItems.map((item) => item.dish_id);
        }

        return [slot.dishId];
      }),
    ),
  ];
  const { dishMap, dishDetailsMap } = await fetchDishMaps({
    dishIds,
    locale,
  });

  const slots = normalizedSlots.map((slot) => {
    const persistedItems = sortSlotItemRows(itemsBySlotId?.get(slot.id) ?? []);

    if (persistedItems.length === 0) {
      const dish = dishMap.get(slot.dishId);

      return buildWeeklyMenuCompatibilitySlotRecordFromSingleDish({
        slotId: slot.id,
        dayIndex: slot.dayIndex,
        mealType: slot.mealType,
        dishId: slot.dishId,
        dishName:
          dish?.name ?? getTranslation(locale, "weeklyMenu.status.unavailableDish"),
        isArchivedDish: dish?.is_archived ?? false,
        dishDetails: dishDetailsMap.get(slot.dishId),
      });
    }

    return buildWeeklyMenuSlotRecord({
      slotId: slot.id,
      dayIndex: slot.dayIndex,
      mealType: slot.mealType,
      items: persistedItems.map((item) => {
        const dish = dishMap.get(item.dish_id);

        return {
          id: item.id,
          slotId: slot.id,
          dishId: item.dish_id,
          sortOrder: item.sort_order,
          dishName:
            dish?.name ?? getTranslation(locale, "weeklyMenu.status.unavailableDish"),
          isArchivedDish: dish?.is_archived ?? false,
          dishDetails: dishDetailsMap.get(item.dish_id),
        };
      }),
    });
  });

  return buildWeeklyMenuView({
    weekRange,
    mealPlanId: mealPlan.id,
    slots,
    locale,
  });
}

export async function addDishToCurrentWeekSlot(args: {
  dayIndex: number;
  mealType: string;
  dishId: string;
}) {
  assertDayIndex(args.dayIndex);
  const normalizedMealType = assertMealType(args.mealType);

  if (!args.dishId) {
    throw new Error("Missing dish id for slot assignment");
  }

  await assertActiveDishAvailable(args.dishId);

  const supabase = getSupabaseServerClient();
  const { familyId, mealPlan } = await ensureCurrentWeekMealPlan();
  const existingSlot = await fetchCurrentWeekSlotRow({
    mealPlanId: mealPlan.id,
    dayIndex: args.dayIndex,
    mealType: normalizedMealType,
  });

  if (!existingSlot) {
    const createdSlot = await createCurrentWeekSlotRow({
      familyId,
      mealPlanId: mealPlan.id,
      dayIndex: args.dayIndex,
      mealType: normalizedMealType,
      dishId: args.dishId,
    });

    const { error } = await supabase.from("meal_plan_slot_items").insert({
      family_id: familyId,
      slot_id: createdSlot.id,
      dish_id: args.dishId,
      sort_order: 0,
    });

    if (error) {
      if (isMissingSlotItemStorageError(error)) {
        await syncShoppingForSlot({
          mealPlanId: mealPlan.id,
          dayIndex: args.dayIndex,
          mealType: normalizedMealType,
        });
        return;
      }

      throw error;
    }

    await syncShoppingForSlot({
      mealPlanId: mealPlan.id,
      dayIndex: args.dayIndex,
      mealType: normalizedMealType,
    });

    return;
  }

  const persistedItems = await ensurePersistedSlotItemsForSlot({
    familyId,
    slot: existingSlot,
  });

  if (!persistedItems) {
    throw new Error("Slot item storage is not available yet.");
  }

  if (persistedItems.some((item) => item.dish_id === args.dishId)) {
    throw new WeeklyMenuMutationError("duplicate_dish_in_slot");
  }

  const nextSortOrder =
    persistedItems.length === 0
      ? 0
      : Math.max(...persistedItems.map((item) => item.sort_order)) + 1;
  const { error } = await supabase.from("meal_plan_slot_items").insert({
    family_id: familyId,
    slot_id: existingSlot.id,
    dish_id: args.dishId,
    sort_order: nextSortOrder,
  });

  if (error) {
    if (error.code === "23505") {
      throw new WeeklyMenuMutationError("duplicate_dish_in_slot");
    }

    throw error;
  }

  await syncShoppingForSlot({
    mealPlanId: mealPlan.id,
    dayIndex: args.dayIndex,
    mealType: normalizedMealType,
  });
}

export async function replaceCurrentWeekSlotItemDish(args: {
  dayIndex: number;
  mealType: string;
  slotItemId: string;
  dishId: string;
}) {
  assertDayIndex(args.dayIndex);
  const normalizedMealType = assertMealType(args.mealType);

  if (!args.slotItemId || !args.dishId) {
    throw new Error("Missing slot item data for replacement");
  }

  await assertActiveDishAvailable(args.dishId);

  const supabase = getSupabaseServerClient();
  const { familyId, mealPlan } = await ensureCurrentWeekMealPlan();
  const slot = await fetchCurrentWeekSlotRow({
    mealPlanId: mealPlan.id,
    dayIndex: args.dayIndex,
    mealType: normalizedMealType,
  });

  if (!slot) {
    throw new WeeklyMenuMutationError("slot_not_found");
  }

  const persistedItems = await ensurePersistedSlotItemsForSlot({
    familyId,
    slot,
  });

  if (!persistedItems) {
    await upsertLegacyCurrentWeekSlotDish({
      familyId,
      mealPlanId: mealPlan.id,
      dayIndex: args.dayIndex,
      mealType: normalizedMealType,
      dishId: args.dishId,
    });
    await syncShoppingForMealPlan({
      mealPlanId: mealPlan.id,
      expectedSourceSlots: [
        {
          dayIndex: args.dayIndex,
          mealType: normalizedMealType,
          expectedDishIds: [args.dishId],
        },
      ],
    });
    return;
  }

  const slotItem = persistedItems.find((item) => item.id === args.slotItemId);

  if (!slotItem) {
    throw new WeeklyMenuMutationError("slot_item_not_found");
  }

  if (slotItem.dish_id === args.dishId) {
    return;
  }

  if (
    persistedItems.some(
      (item) => item.id !== args.slotItemId && item.dish_id === args.dishId,
    )
  ) {
    throw new WeeklyMenuMutationError("duplicate_dish_in_slot");
  }

  const { error } = await supabase
    .from("meal_plan_slot_items")
    .update({
      dish_id: args.dishId,
    })
    .eq("id", args.slotItemId)
    .eq("slot_id", slot.id);

  if (error) {
    if (error.code === "23505") {
      throw new WeeklyMenuMutationError("duplicate_dish_in_slot");
    }

    throw error;
  }

  const primaryItem = sortSlotItemRows(persistedItems)[0];

  if (primaryItem?.id === args.slotItemId) {
    await updateSlotPrimaryDish({
      slotId: slot.id,
      dishId: args.dishId,
    });
  }

  const expectedDishIds = sortSlotItemRows(
    persistedItems.map((item) =>
      item.id === args.slotItemId
        ? {
            ...item,
            dish_id: args.dishId,
          }
        : item,
    ),
  ).map((item) => item.dish_id);

  await syncShoppingForMealPlan({
    mealPlanId: mealPlan.id,
    expectedSourceSlots: [
      {
        dayIndex: args.dayIndex,
        mealType: normalizedMealType,
        expectedDishIds,
      },
    ],
  });
}

export async function removeCurrentWeekSlotItem(args: {
  dayIndex: number;
  mealType: string;
  slotItemId: string;
}) {
  assertDayIndex(args.dayIndex);
  const normalizedMealType = assertMealType(args.mealType);

  if (!args.slotItemId) {
    throw new Error("Missing slot item id for removal");
  }

  const supabase = getSupabaseServerClient();
  const { familyId, mealPlan } = await fetchCurrentWeekMealPlan();

  if (!mealPlan) {
    return {
      slotIsEmpty: true,
    };
  }

  const slot = await fetchCurrentWeekSlotRow({
    mealPlanId: mealPlan.id,
    dayIndex: args.dayIndex,
    mealType: normalizedMealType,
  });

  if (!slot) {
    throw new WeeklyMenuMutationError("slot_not_found");
  }

  const persistedItems = await ensurePersistedSlotItemsForSlot({
    familyId,
    slot,
  });

  if (!persistedItems) {
    await clearCurrentWeekSlot({
      dayIndex: args.dayIndex,
      mealType: normalizedMealType,
    });
    return {
      slotIsEmpty: true,
    };
  }

  const slotItem = persistedItems.find((item) => item.id === args.slotItemId);

  if (!slotItem) {
    throw new WeeklyMenuMutationError("slot_item_not_found");
  }

  const remainingItems = sortSlotItemRows(
    persistedItems.filter((item) => item.id !== args.slotItemId),
  );

  const { error: deleteItemError } = await supabase
    .from("meal_plan_slot_items")
    .delete()
    .eq("id", args.slotItemId)
    .eq("slot_id", slot.id);

  if (deleteItemError) {
    throw deleteItemError;
  }

  if (remainingItems.length === 0) {
    const { error: deleteSlotError } = await supabase
      .from("meal_plan_slots")
      .delete()
      .eq("id", slot.id);

    if (deleteSlotError) {
      throw deleteSlotError;
    }
  } else {
    const primaryItem = remainingItems[0];

    if (primaryItem && primaryItem.dish_id !== slot.dishId) {
      await updateSlotPrimaryDish({
        slotId: slot.id,
        dishId: primaryItem.dish_id,
      });
    }
  }

  await syncShoppingForSlot({
    mealPlanId: mealPlan.id,
    dayIndex: args.dayIndex,
    mealType: normalizedMealType,
  });

  return {
    slotIsEmpty: remainingItems.length === 0,
  };
}

export async function copyCurrentWeekSlotItem(args: {
  sourceDayIndex: number;
  sourceMealType: string;
  slotItemId: string;
  targetDayIndex: number;
  targetMealType: string;
}) {
  assertDayIndex(args.sourceDayIndex);
  assertDayIndex(args.targetDayIndex);
  const sourceMealType = assertMealType(args.sourceMealType);
  const targetMealType = assertMealType(args.targetMealType);

  if (!args.slotItemId) {
    throw new Error("Missing slot item id for reuse");
  }

  const { familyId, mealPlan } = await fetchCurrentWeekMealPlan();

  if (!mealPlan) {
    throw new WeeklyMenuMutationError("slot_not_found");
  }

  const sourceSlot = await fetchCurrentWeekSlotRow({
    mealPlanId: mealPlan.id,
    dayIndex: args.sourceDayIndex,
    mealType: sourceMealType,
  });

  if (!sourceSlot) {
    throw new WeeklyMenuMutationError("slot_not_found");
  }

  const sourceItems = await ensurePersistedSlotItemsForSlot({
    familyId,
    slot: sourceSlot,
  });

  if (!sourceItems) {
    throw new Error("Slot item storage is not available yet.");
  }

  const sourceItem = sourceItems.find((item) => item.id === args.slotItemId);

  if (!sourceItem) {
    throw new WeeklyMenuMutationError("slot_item_not_found");
  }

  await assertActiveDishAvailable(sourceItem.dish_id);

  const targetSlot = await fetchCurrentWeekSlotRow({
    mealPlanId: mealPlan.id,
    dayIndex: args.targetDayIndex,
    mealType: targetMealType,
  });

  if (!targetSlot) {
    const createdSlot = await createCurrentWeekSlotRow({
      familyId,
      mealPlanId: mealPlan.id,
      dayIndex: args.targetDayIndex,
      mealType: targetMealType,
      dishId: sourceItem.dish_id,
    });

    await insertSlotItems({
      familyId,
      slotId: createdSlot.id,
      dishIds: [sourceItem.dish_id],
    });

    await syncShoppingForMealPlan({
      mealPlanId: mealPlan.id,
      expectedSourceSlots: [
        {
          dayIndex: args.targetDayIndex,
          mealType: targetMealType,
          expectedDishIds: [sourceItem.dish_id],
        },
      ],
    });
    return;
  }

  const targetItems = await ensurePersistedSlotItemsForSlot({
    familyId,
    slot: targetSlot,
  });

  if (!targetItems) {
    throw new Error("Slot item storage is not available yet.");
  }

  if (targetItems.some((item) => item.dish_id === sourceItem.dish_id)) {
    throw new WeeklyMenuMutationError("duplicate_dish_in_slot");
  }

  const nextSortOrder =
    targetItems.length === 0
      ? 0
      : Math.max(...targetItems.map((item) => item.sort_order)) + 1;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("meal_plan_slot_items").insert({
    family_id: familyId,
    slot_id: targetSlot.id,
    dish_id: sourceItem.dish_id,
    sort_order: nextSortOrder,
  });

  if (error) {
    if (error.code === "23505") {
      throw new WeeklyMenuMutationError("duplicate_dish_in_slot");
    }

    throw error;
  }

  if (nextSortOrder === 0) {
    await updateSlotPrimaryDish({
      slotId: targetSlot.id,
      dishId: sourceItem.dish_id,
    });
  }

  await syncShoppingForMealPlan({
    mealPlanId: mealPlan.id,
    expectedSourceSlots: [
      {
        dayIndex: args.targetDayIndex,
        mealType: targetMealType,
        expectedDishIds: [...targetItems.map((item) => item.dish_id), sourceItem.dish_id],
      },
    ],
  });
}

export async function copyCurrentWeekSlot(args: {
  sourceDayIndex: number;
  sourceMealType: string;
  targetDayIndex: number;
  targetMealType: string;
}) {
  assertDayIndex(args.sourceDayIndex);
  assertDayIndex(args.targetDayIndex);
  const sourceMealType = assertMealType(args.sourceMealType);
  const targetMealType = assertMealType(args.targetMealType);

  const { familyId, mealPlan } = await fetchCurrentWeekMealPlan();

  if (!mealPlan) {
    throw new WeeklyMenuMutationError("slot_not_found");
  }

  const sourceSlot = await fetchCurrentWeekSlotRow({
    mealPlanId: mealPlan.id,
    dayIndex: args.sourceDayIndex,
    mealType: sourceMealType,
  });

  if (!sourceSlot) {
    throw new WeeklyMenuMutationError("slot_not_found");
  }

  const sourceItems = await ensurePersistedSlotItemsForSlot({
    familyId,
    slot: sourceSlot,
  });

  if (!sourceItems || sourceItems.length === 0) {
    throw new WeeklyMenuMutationError("slot_not_found");
  }

  const orderedSourceItems = sortSlotItemRows(sourceItems);
  const sourceDishIds = orderedSourceItems.map((item) => item.dish_id);

  await assertActiveDishesAvailable(sourceDishIds);

  const targetSlot = await fetchCurrentWeekSlotRow({
    mealPlanId: mealPlan.id,
    dayIndex: args.targetDayIndex,
    mealType: targetMealType,
  });

  if (!targetSlot) {
    const createdSlot = await createCurrentWeekSlotRow({
      familyId,
      mealPlanId: mealPlan.id,
      dayIndex: args.targetDayIndex,
      mealType: targetMealType,
      dishId: sourceDishIds[0],
    });

    await insertSlotItems({
      familyId,
      slotId: createdSlot.id,
      dishIds: sourceDishIds,
    });

    await syncShoppingForMealPlan({
      mealPlanId: mealPlan.id,
      expectedSourceSlots: [
        {
          dayIndex: args.targetDayIndex,
          mealType: targetMealType,
          expectedDishIds: sourceDishIds,
        },
      ],
    });
    return;
  }

  const targetItems = await ensurePersistedSlotItemsForSlot({
    familyId,
    slot: targetSlot,
  });

  if (!targetItems) {
    throw new Error("Slot item storage is not available yet.");
  }

  if (targetItems.length > 0) {
    throw new WeeklyMenuMutationError("slot_not_empty");
  }
  await insertSlotItems({
    familyId,
    slotId: targetSlot.id,
    dishIds: sourceDishIds,
  });
  await updateSlotPrimaryDish({
    slotId: targetSlot.id,
    dishId: sourceDishIds[0],
  });

  await syncShoppingForMealPlan({
    mealPlanId: mealPlan.id,
    expectedSourceSlots: [
      {
        dayIndex: args.targetDayIndex,
        mealType: targetMealType,
        expectedDishIds: sourceDishIds,
      },
    ],
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

  const { familyId, mealPlan } = await ensureCurrentWeekMealPlan();
  const existingSlot = await fetchCurrentWeekSlotRow({
    mealPlanId: mealPlan.id,
    dayIndex,
    mealType: normalizedMealType,
  });

  if (!existingSlot) {
    await addDishToCurrentWeekSlot({
      dayIndex,
      mealType: normalizedMealType,
      dishId,
    });
    return;
  }

  const persistedItems = await ensurePersistedSlotItemsForSlot({
    familyId,
    slot: existingSlot,
  });

  if (!persistedItems) {
    await upsertLegacyCurrentWeekSlotDish({
      familyId,
      mealPlanId: mealPlan.id,
      dayIndex,
      mealType: normalizedMealType,
      dishId,
    });
    await syncShoppingForSlot({
      mealPlanId: mealPlan.id,
      dayIndex,
      mealType: normalizedMealType,
    });
    return;
  }

  const primaryItem = sortSlotItemRows(persistedItems)[0];

  if (!primaryItem) {
    await addDishToCurrentWeekSlot({
      dayIndex,
      mealType: normalizedMealType,
      dishId,
    });
    return;
  }

  await replaceCurrentWeekSlotItemDish({
    dayIndex,
    mealType: normalizedMealType,
    slotItemId: primaryItem.id,
    dishId,
  });
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

  await syncShoppingForSlot({
    mealPlanId: mealPlan.id,
    dayIndex,
    mealType: normalizedMealType,
  });
}
