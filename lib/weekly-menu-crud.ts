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

type WeeklyMenuMutationTraceStage = {
  name: string;
  durationMs: number;
};

function isWeeklyMenuPostTraceEnabled() {
  return process.env.PLAN_EAT_TRACE_WEEKLY_MENU_POST === "1";
}

function roundTraceDuration(durationMs: number) {
  return Math.round(durationMs * 100) / 100;
}

function serializeTraceError(error: unknown) {
  if (error instanceof WeeklyMenuMutationError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    name: "UnknownError",
    message: "Unknown weekly menu mutation error",
  };
}

function createWeeklyMenuMutationTrace(
  mutation: string,
  context: Record<string, unknown>,
) {
  const enabled = isWeeklyMenuPostTraceEnabled();
  const startedAt = enabled ? performance.now() : 0;
  const stages: WeeklyMenuMutationTraceStage[] = [];
  let flushed = false;

  async function step<T>(name: string, run: () => Promise<T> | T): Promise<T> {
    if (!enabled) {
      return run();
    }

    const stageStartedAt = performance.now();

    try {
      return await run();
    } finally {
      stages.push({
        name,
        durationMs: roundTraceDuration(performance.now() - stageStartedAt),
      });
    }
  }

  function flush(status: "success" | "error", details?: Record<string, unknown>) {
    if (!enabled || flushed) {
      return;
    }

    flushed = true;

    console.log(
      `[weekly-menu-post-trace] ${JSON.stringify({
        mutation,
        status,
        totalDurationMs: roundTraceDuration(performance.now() - startedAt),
        stageCount: stages.length,
        context,
        stages,
        ...(details ? { details } : {}),
      })}`,
    );
  }

  return {
    step,
    success(details?: Record<string, unknown>) {
      flush("success", details);
    },
    failure(error: unknown, details?: Record<string, unknown>) {
      flush("error", {
        ...(details ?? {}),
        error: serializeTraceError(error),
      });
    },
  };
}

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
      wasCreated: true,
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

  return {
    ...existingSlot,
    wasCreated: false,
  };
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
  if (uniqueDishIds.length === 0) {
    return;
  }

  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();
  const { data: dishes, error: dishesError } = await supabase
    .from("dishes")
    .select("id")
    .in("id", uniqueDishIds)
    .eq("family_id", familyId)
    .eq("is_archived", false);

  if (dishesError) {
    throw dishesError;
  }

  const availableDishIds = new Set(
    ((dishes ?? []) as Array<Pick<DishNameRow, "id">>).map((dish) => dish.id),
  );

  for (const dishId of uniqueDishIds) {
    if (!availableDishIds.has(dishId)) {
      throw new WeeklyMenuMutationError("dish_not_available");
    }
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

async function recordShoppingListSourceChange(mealPlanId: string) {
  const {
    markShoppingListSourceChangedByMealPlanId,
    scheduleWeeklyMenuShoppingListControlPass,
  } = await import(
    "@/lib/shopping-list-crud"
  );

  await markShoppingListSourceChangedByMealPlanId(mealPlanId);
  scheduleWeeklyMenuShoppingListControlPass(mealPlanId);
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
  const trace = createWeeklyMenuMutationTrace("addDishToCurrentWeekSlot", {
    dayIndex: args.dayIndex,
    mealType: normalizedMealType,
  });
  let traceError: unknown;
  const traceDetails: Record<string, unknown> = {
    dishId: args.dishId,
  };

  try {
    if (!args.dishId) {
      throw new Error("Missing dish id for slot assignment");
    }

    await trace.step("assertActiveDishAvailable", () =>
      assertActiveDishAvailable(args.dishId),
    );

    const supabase = getSupabaseServerClient();
    const { familyId, mealPlan } = await trace.step("ensureCurrentWeekMealPlan", () =>
      ensureCurrentWeekMealPlan(),
    );
    const resolvedSlot = await trace.step("createCurrentWeekSlotRow", () =>
      createCurrentWeekSlotRow({
        familyId,
        mealPlanId: mealPlan.id,
        dayIndex: args.dayIndex,
        mealType: normalizedMealType,
        dishId: args.dishId,
      }),
    );
    traceDetails.slotWasCreated = resolvedSlot.wasCreated;

    if (resolvedSlot.wasCreated) {
      const { error } = await trace.step("insertInitialSlotItem", () =>
        supabase.from("meal_plan_slot_items").insert({
          family_id: familyId,
          slot_id: resolvedSlot.id,
          dish_id: args.dishId,
          sort_order: 0,
        }),
      );

      if (error) {
        if (isMissingSlotItemStorageError(error)) {
          traceDetails.slotItemStorageMissing = true;
          await trace.step("recordShoppingListSourceChange", () =>
            recordShoppingListSourceChange(mealPlan.id),
          );
          return;
        }

        throw error;
      }

      await trace.step("recordShoppingListSourceChange", () =>
        recordShoppingListSourceChange(mealPlan.id),
      );

      return;
    }

    const existingSlot = resolvedSlot;
    const persistedItems = await trace.step("ensurePersistedSlotItemsForSlot", () =>
      ensurePersistedSlotItemsForSlot({
        familyId,
        slot: existingSlot,
      }),
    );

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
    traceDetails.nextSortOrder = nextSortOrder;

    const { error } = await trace.step("insertSlotItem", () =>
      supabase.from("meal_plan_slot_items").insert({
        family_id: familyId,
        slot_id: existingSlot.id,
        dish_id: args.dishId,
        sort_order: nextSortOrder,
      }),
    );

    if (error) {
      if (error.code === "23505") {
        throw new WeeklyMenuMutationError("duplicate_dish_in_slot");
      }

      throw error;
    }

    await trace.step("recordShoppingListSourceChange", () =>
      recordShoppingListSourceChange(mealPlan.id),
    );
  } catch (error) {
    traceError = error;
    throw error;
  } finally {
    if (traceError) {
      trace.failure(traceError, traceDetails);
    } else {
      trace.success(traceDetails);
    }
  }
}

export async function replaceCurrentWeekSlotItemDish(args: {
  dayIndex: number;
  mealType: string;
  slotItemId: string;
  dishId: string;
}) {
  assertDayIndex(args.dayIndex);
  const normalizedMealType = assertMealType(args.mealType);
  const trace = createWeeklyMenuMutationTrace("replaceCurrentWeekSlotItemDish", {
    dayIndex: args.dayIndex,
    mealType: normalizedMealType,
    slotItemId: args.slotItemId,
  });
  let traceError: unknown;
  const traceDetails: Record<string, unknown> = {
    dishId: args.dishId,
  };

  try {
    if (!args.slotItemId || !args.dishId) {
      throw new Error("Missing slot item data for replacement");
    }

    await trace.step("assertActiveDishAvailable", () =>
      assertActiveDishAvailable(args.dishId),
    );

    const supabase = getSupabaseServerClient();
    const { familyId, mealPlan } = await trace.step("ensureCurrentWeekMealPlan", () =>
      ensureCurrentWeekMealPlan(),
    );
    const slot = await trace.step("fetchCurrentWeekSlotRow", () =>
      fetchCurrentWeekSlotRow({
        mealPlanId: mealPlan.id,
        dayIndex: args.dayIndex,
        mealType: normalizedMealType,
      }),
    );

    if (!slot) {
      throw new WeeklyMenuMutationError("slot_not_found");
    }

    const persistedItems = await trace.step("ensurePersistedSlotItemsForSlot", () =>
      ensurePersistedSlotItemsForSlot({
        familyId,
        slot,
      }),
    );

    if (!persistedItems) {
      traceDetails.legacyFallback = true;

      if (slot.dishId === args.dishId) {
        traceDetails.noop = true;
        return;
      }

      await trace.step("upsertLegacyCurrentWeekSlotDish", () =>
        upsertLegacyCurrentWeekSlotDish({
          familyId,
          mealPlanId: mealPlan.id,
          dayIndex: args.dayIndex,
          mealType: normalizedMealType,
          dishId: args.dishId,
        }),
      );
      await trace.step("recordShoppingListSourceChange", () =>
        recordShoppingListSourceChange(mealPlan.id),
      );
      return;
    }

    const slotItem = persistedItems.find((item) => item.id === args.slotItemId);

    if (!slotItem) {
      throw new WeeklyMenuMutationError("slot_item_not_found");
    }

    if (slotItem.dish_id === args.dishId) {
      traceDetails.noop = true;
      return;
    }

    if (
      persistedItems.some(
        (item) => item.id !== args.slotItemId && item.dish_id === args.dishId,
      )
    ) {
      throw new WeeklyMenuMutationError("duplicate_dish_in_slot");
    }

    const { error } = await trace.step("updateSlotItemDish", () =>
      supabase
        .from("meal_plan_slot_items")
        .update({
          dish_id: args.dishId,
        })
        .eq("id", args.slotItemId)
        .eq("slot_id", slot.id),
    );

    if (error) {
      if (error.code === "23505") {
        throw new WeeklyMenuMutationError("duplicate_dish_in_slot");
      }

      throw error;
    }

    const primaryItem = sortSlotItemRows(persistedItems)[0];
    traceDetails.replacedPrimaryItem = primaryItem?.id === args.slotItemId;

    if (primaryItem?.id === args.slotItemId) {
      await trace.step("updateSlotPrimaryDish", () =>
        updateSlotPrimaryDish({
          slotId: slot.id,
          dishId: args.dishId,
        }),
      );
    }

    await trace.step("recordShoppingListSourceChange", () =>
      recordShoppingListSourceChange(mealPlan.id),
    );
  } catch (error) {
    traceError = error;
    throw error;
  } finally {
    if (traceError) {
      trace.failure(traceError, traceDetails);
    } else {
      trace.success(traceDetails);
    }
  }
}

export async function removeCurrentWeekSlotItem(args: {
  dayIndex: number;
  mealType: string;
  slotItemId: string;
}) {
  assertDayIndex(args.dayIndex);
  const normalizedMealType = assertMealType(args.mealType);
  const trace = createWeeklyMenuMutationTrace("removeCurrentWeekSlotItem", {
    dayIndex: args.dayIndex,
    mealType: normalizedMealType,
    slotItemId: args.slotItemId,
  });
  let traceError: unknown;
  const traceDetails: Record<string, unknown> = {};

  try {
    if (!args.slotItemId) {
      throw new Error("Missing slot item id for removal");
    }

    const supabase = getSupabaseServerClient();
    const { familyId, mealPlan } = await trace.step("fetchCurrentWeekMealPlan", () =>
      fetchCurrentWeekMealPlan(),
    );

    if (!mealPlan) {
      traceDetails.slotIsEmpty = true;
      return {
        slotIsEmpty: true,
      };
    }

    const slot = await trace.step("fetchCurrentWeekSlotRow", () =>
      fetchCurrentWeekSlotRow({
        mealPlanId: mealPlan.id,
        dayIndex: args.dayIndex,
        mealType: normalizedMealType,
      }),
    );

    if (!slot) {
      throw new WeeklyMenuMutationError("slot_not_found");
    }

    const persistedItems = await trace.step("ensurePersistedSlotItemsForSlot", () =>
      ensurePersistedSlotItemsForSlot({
        familyId,
        slot,
      }),
    );

    if (!persistedItems) {
      traceDetails.legacyFallback = true;
      await trace.step("clearCurrentWeekSlot", () =>
        clearCurrentWeekSlot({
          dayIndex: args.dayIndex,
          mealType: normalizedMealType,
        }),
      );
      traceDetails.slotIsEmpty = true;
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
    traceDetails.slotIsEmpty = remainingItems.length === 0;

    const { error: deleteItemError } = await trace.step("deleteSlotItem", () =>
      supabase
        .from("meal_plan_slot_items")
        .delete()
        .eq("id", args.slotItemId)
        .eq("slot_id", slot.id),
    );

    if (deleteItemError) {
      throw deleteItemError;
    }

    if (remainingItems.length === 0) {
      const { error: deleteSlotError } = await trace.step("deleteSlotRow", () =>
        supabase.from("meal_plan_slots").delete().eq("id", slot.id),
      );

      if (deleteSlotError) {
        throw deleteSlotError;
      }
    } else {
      const primaryItem = remainingItems[0];
      traceDetails.updatedPrimaryDish = primaryItem
        ? primaryItem.dish_id !== slot.dishId
        : false;

      if (primaryItem && primaryItem.dish_id !== slot.dishId) {
        await trace.step("updateSlotPrimaryDish", () =>
          updateSlotPrimaryDish({
            slotId: slot.id,
            dishId: primaryItem.dish_id,
          }),
        );
      }
    }

    await trace.step("recordShoppingListSourceChange", () =>
      recordShoppingListSourceChange(mealPlan.id),
    );

    return {
      slotIsEmpty: remainingItems.length === 0,
    };
  } catch (error) {
    traceError = error;
    throw error;
  } finally {
    if (traceError) {
      trace.failure(traceError, traceDetails);
    } else {
      trace.success(traceDetails);
    }
  }
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
  const trace = createWeeklyMenuMutationTrace("copyCurrentWeekSlotItem", {
    sourceDayIndex: args.sourceDayIndex,
    sourceMealType,
    targetDayIndex: args.targetDayIndex,
    targetMealType,
    slotItemId: args.slotItemId,
  });
  let traceError: unknown;
  const traceDetails: Record<string, unknown> = {};

  try {
    if (!args.slotItemId) {
      throw new Error("Missing slot item id for reuse");
    }

    const { familyId, mealPlan } = await trace.step("fetchCurrentWeekMealPlan", () =>
      fetchCurrentWeekMealPlan(),
    );

    if (!mealPlan) {
      throw new WeeklyMenuMutationError("slot_not_found");
    }

    const sourceSlot = await trace.step("fetchSourceSlot", () =>
      fetchCurrentWeekSlotRow({
        mealPlanId: mealPlan.id,
        dayIndex: args.sourceDayIndex,
        mealType: sourceMealType,
      }),
    );

    if (!sourceSlot) {
      throw new WeeklyMenuMutationError("slot_not_found");
    }

    const sourceItems = await trace.step("ensureSourcePersistedSlotItems", () =>
      ensurePersistedSlotItemsForSlot({
        familyId,
        slot: sourceSlot,
      }),
    );

    if (!sourceItems) {
      throw new Error("Slot item storage is not available yet.");
    }

    const sourceItem = sourceItems.find((item) => item.id === args.slotItemId);

    if (!sourceItem) {
      throw new WeeklyMenuMutationError("slot_item_not_found");
    }

    traceDetails.dishId = sourceItem.dish_id;
    await trace.step("assertActiveDishAvailable", () =>
      assertActiveDishAvailable(sourceItem.dish_id),
    );

    const targetSlot = await trace.step("fetchTargetSlot", () =>
      fetchCurrentWeekSlotRow({
        mealPlanId: mealPlan.id,
        dayIndex: args.targetDayIndex,
        mealType: targetMealType,
      }),
    );

    if (!targetSlot) {
      traceDetails.targetSlotCreated = true;
      const createdSlot = await trace.step("createTargetSlot", () =>
        createCurrentWeekSlotRow({
          familyId,
          mealPlanId: mealPlan.id,
          dayIndex: args.targetDayIndex,
          mealType: targetMealType,
          dishId: sourceItem.dish_id,
        }),
      );

      await trace.step("insertSlotItems", () =>
        insertSlotItems({
          familyId,
          slotId: createdSlot.id,
          dishIds: [sourceItem.dish_id],
        }),
      );

      await trace.step("recordShoppingListSourceChange", () =>
        recordShoppingListSourceChange(mealPlan.id),
      );
      return;
    }

    const targetItems = await trace.step("ensureTargetPersistedSlotItems", () =>
      ensurePersistedSlotItemsForSlot({
        familyId,
        slot: targetSlot,
      }),
    );

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
    traceDetails.nextSortOrder = nextSortOrder;

    const supabase = getSupabaseServerClient();
    const { error } = await trace.step("insertCopiedSlotItem", () =>
      supabase.from("meal_plan_slot_items").insert({
        family_id: familyId,
        slot_id: targetSlot.id,
        dish_id: sourceItem.dish_id,
        sort_order: nextSortOrder,
      }),
    );

    if (error) {
      if (error.code === "23505") {
        throw new WeeklyMenuMutationError("duplicate_dish_in_slot");
      }

      throw error;
    }

    if (nextSortOrder === 0) {
      await trace.step("updateSlotPrimaryDish", () =>
        updateSlotPrimaryDish({
          slotId: targetSlot.id,
          dishId: sourceItem.dish_id,
        }),
      );
    }

    await trace.step("recordShoppingListSourceChange", () =>
      recordShoppingListSourceChange(mealPlan.id),
    );
  } catch (error) {
    traceError = error;
    throw error;
  } finally {
    if (traceError) {
      trace.failure(traceError, traceDetails);
    } else {
      trace.success(traceDetails);
    }
  }
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
  const trace = createWeeklyMenuMutationTrace("copyCurrentWeekSlot", {
    sourceDayIndex: args.sourceDayIndex,
    sourceMealType,
    targetDayIndex: args.targetDayIndex,
    targetMealType,
  });
  let traceError: unknown;
  const traceDetails: Record<string, unknown> = {};

  try {
    const { familyId, mealPlan } = await trace.step("fetchCurrentWeekMealPlan", () =>
      fetchCurrentWeekMealPlan(),
    );

    if (!mealPlan) {
      throw new WeeklyMenuMutationError("slot_not_found");
    }

    const sourceSlot = await trace.step("fetchSourceSlot", () =>
      fetchCurrentWeekSlotRow({
        mealPlanId: mealPlan.id,
        dayIndex: args.sourceDayIndex,
        mealType: sourceMealType,
      }),
    );

    if (!sourceSlot) {
      throw new WeeklyMenuMutationError("slot_not_found");
    }

    const sourceItems = await trace.step("ensureSourcePersistedSlotItems", () =>
      ensurePersistedSlotItemsForSlot({
        familyId,
        slot: sourceSlot,
      }),
    );

    if (!sourceItems || sourceItems.length === 0) {
      throw new WeeklyMenuMutationError("slot_not_found");
    }

    const orderedSourceItems = sortSlotItemRows(sourceItems);
    const sourceDishIds = orderedSourceItems.map((item) => item.dish_id);
    traceDetails.sourceDishCount = sourceDishIds.length;

    await trace.step("assertActiveDishesAvailable", () =>
      assertActiveDishesAvailable(sourceDishIds),
    );

    const targetSlot = await trace.step("fetchTargetSlot", () =>
      fetchCurrentWeekSlotRow({
        mealPlanId: mealPlan.id,
        dayIndex: args.targetDayIndex,
        mealType: targetMealType,
      }),
    );

    if (!targetSlot) {
      traceDetails.targetSlotCreated = true;
      const createdSlot = await trace.step("createTargetSlot", () =>
        createCurrentWeekSlotRow({
          familyId,
          mealPlanId: mealPlan.id,
          dayIndex: args.targetDayIndex,
          mealType: targetMealType,
          dishId: sourceDishIds[0],
        }),
      );

      await trace.step("insertSlotItems", () =>
        insertSlotItems({
          familyId,
          slotId: createdSlot.id,
          dishIds: sourceDishIds,
        }),
      );

      await trace.step("recordShoppingListSourceChange", () =>
        recordShoppingListSourceChange(mealPlan.id),
      );
      return;
    }

    const targetItems = await trace.step("ensureTargetPersistedSlotItems", () =>
      ensurePersistedSlotItemsForSlot({
        familyId,
        slot: targetSlot,
      }),
    );

    if (!targetItems) {
      throw new Error("Slot item storage is not available yet.");
    }

    if (targetItems.length > 0) {
      throw new WeeklyMenuMutationError("slot_not_empty");
    }

    await trace.step("insertSlotItems", () =>
      insertSlotItems({
        familyId,
        slotId: targetSlot.id,
        dishIds: sourceDishIds,
      }),
    );
    await trace.step("updateSlotPrimaryDish", () =>
      updateSlotPrimaryDish({
        slotId: targetSlot.id,
        dishId: sourceDishIds[0],
      }),
    );

    await trace.step("recordShoppingListSourceChange", () =>
      recordShoppingListSourceChange(mealPlan.id),
    );
  } catch (error) {
    traceError = error;
    throw error;
  } finally {
    if (traceError) {
      trace.failure(traceError, traceDetails);
    } else {
      trace.success(traceDetails);
    }
  }
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
    if (existingSlot.dishId === dishId) {
      return;
    }

    await upsertLegacyCurrentWeekSlotDish({
      familyId,
      mealPlanId: mealPlan.id,
      dayIndex,
      mealType: normalizedMealType,
      dishId,
    });
    await recordShoppingListSourceChange(mealPlan.id);
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

  const existingSlot = await fetchCurrentWeekSlotRow({
    mealPlanId: mealPlan.id,
    dayIndex,
    mealType: normalizedMealType,
  });

  if (!existingSlot) {
    return;
  }

  const { error } = await supabase.from("meal_plan_slots").delete().eq("id", existingSlot.id);

  if (error) {
    throw error;
  }

  await recordShoppingListSourceChange(mealPlan.id);
}
