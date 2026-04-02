import "server-only";

import type { IngredientUnit } from "@/lib/dish-form";
import {
  getPublishedShoppingListSourceVersion,
  hasPublishedShoppingListBaseline,
  isShoppingListFreshnessState,
  shoppingListControlPlaneSelect,
  type ShoppingListControlPlaneRow,
  type ShoppingListFreshnessState,
} from "@/lib/shopping-list-authority";
import type { ShoppingListSourceType } from "@/lib/shopping-list";
import { getCurrentFamilyId, getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentWeekRange } from "@/lib/weekly-menu";

type MealPlanRow = {
  id: string;
  family_id: string;
  start_date: string;
  end_date: string;
};

type ShoppingListReadHeaderRow = {
  id: string;
  meal_plan_id: string;
  generated_at: string | null;
  last_synced_at: string | null;
  last_source_change_at: string;
  needs_resync: boolean;
} & ShoppingListControlPlaneRow;

type ShoppingListItemRow = {
  id: string;
  shopping_list_id: string;
  ingredient_name: string;
  normalized_name: string | null;
  quantity: number | string;
  unit: IngredientUnit;
  source_type: ShoppingListSourceType;
  is_checked: boolean;
  product_id: string | null;
  source_key: string | null;
};

type ShoppingListCountResult = {
  count: number | null;
};

const SHOPPING_LIST_READ_SELECT = [
  "id",
  "meal_plan_id",
  "generated_at",
  "last_synced_at",
  "last_source_change_at",
  "needs_resync",
  shoppingListControlPlaneSelect,
].join(", ");

export type CurrentWeekShoppingListSnapshot = {
  shoppingListId: string;
  mealPlanId: string;
  generatedAt?: string;
  lastSyncedAt?: string;
  lastSourceChangeAt: string;
  needsResync: boolean;
  items: Array<{
    id: string;
    ingredientName: string;
    normalizedName: string | null;
    quantity: string;
    unit: IngredientUnit;
    sourceType: ShoppingListSourceType;
    isChecked: boolean;
    productId: string | null;
    sourceKey: string | null;
  }>;
};

export type CurrentWeekShoppingListReadStatus = {
  hasPublishedBaseline: boolean;
  freshnessState: ShoppingListFreshnessState;
  publishedSourceVersion: string | null;
  recomputeRequestedAt: string | null;
  lastFailureAt: string | null;
  lastFailureReason: string | null;
};

export type CurrentWeekShoppingListSummary = {
  totalItems: number;
  toBuyCount: number;
  boughtCount: number;
  isSyncPending: boolean;
  freshnessState: ShoppingListFreshnessState;
  hasPublishedBaseline: boolean;
};

export type CurrentWeekShoppingListPageData = {
  hasMealPlan: boolean;
  snapshot: CurrentWeekShoppingListSnapshot | null;
  status: CurrentWeekShoppingListReadStatus | null;
  isSyncPending: boolean;
};

export type EditableShoppingListItem = {
  id: string;
  shoppingListId: string;
  ingredientName: string;
  normalizedName: string | null;
  quantity: string;
  unit: IngredientUnit;
  sourceType: ShoppingListSourceType;
  isChecked: boolean;
  productId: string | null;
  sourceKey: string | null;
};

function formatQuantity(value: number | string) {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? `${numericValue}` : "";
}

function getSyntheticNoProjectionStatus(): CurrentWeekShoppingListReadStatus {
  return {
    hasPublishedBaseline: false,
    freshnessState: "no_projection",
    publishedSourceVersion: null,
    recomputeRequestedAt: null,
    lastFailureAt: null,
    lastFailureReason: null,
  };
}

function mapShoppingListReadStatus(
  shoppingList: ShoppingListReadHeaderRow | null,
): CurrentWeekShoppingListReadStatus {
  if (!shoppingList) {
    return getSyntheticNoProjectionStatus();
  }

  return {
    hasPublishedBaseline: hasPublishedShoppingListBaseline(shoppingList),
    freshnessState: shoppingList.freshness_state,
    publishedSourceVersion:
      getPublishedShoppingListSourceVersion(shoppingList)?.toString() ?? null,
    recomputeRequestedAt: shoppingList.recompute_requested_at,
    lastFailureAt: shoppingList.last_failure_at,
    lastFailureReason: shoppingList.last_failure_reason,
  };
}

function isReadPending(status: CurrentWeekShoppingListReadStatus | null) {
  return (
    status?.freshnessState === "stale_pending" ||
    status?.freshnessState === "updating"
  );
}

async function fetchCurrentWeekMealPlanReadContext() {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();
  const weekRange = getCurrentWeekRange();

  const { data, error } = await supabase
    .from("meal_plans")
    .select("id, family_id, start_date, end_date")
    .eq("family_id", familyId)
    .eq("start_date", weekRange.startDate)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as MealPlanRow | null;
}

async function fetchShoppingListReadHeaderByMealPlanId(mealPlanId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("shopping_lists")
    .select(SHOPPING_LIST_READ_SELECT)
    .eq("meal_plan_id", mealPlanId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const shoppingList = (data ?? null) as ShoppingListReadHeaderRow | null;

  if (shoppingList && !isShoppingListFreshnessState(shoppingList.freshness_state)) {
    throw new Error(`Invalid shopping list freshness state: ${shoppingList.freshness_state}`);
  }

  return shoppingList;
}

async function fetchPublishedShoppingListCounts(shoppingListId: string) {
  const supabase = getSupabaseServerClient();
  const [
    { count: totalItemsCount, error: totalItemsError },
    { count: toBuyItemsCount, error: toBuyItemsError },
  ] = await Promise.all([
    supabase
      .from("shopping_list_items")
      .select("id", { count: "exact", head: true })
      .eq("shopping_list_id", shoppingListId),
    supabase
      .from("shopping_list_items")
      .select("id", { count: "exact", head: true })
      .eq("shopping_list_id", shoppingListId)
      .eq("is_checked", false),
  ]);

  if (totalItemsError) {
    throw totalItemsError;
  }

  if (toBuyItemsError) {
    throw toBuyItemsError;
  }

  return {
    totalItems: (totalItemsCount as ShoppingListCountResult["count"]) ?? 0,
    toBuyCount: (toBuyItemsCount as ShoppingListCountResult["count"]) ?? 0,
  };
}

async function fetchPublishedShoppingListSnapshot(
  shoppingList: ShoppingListReadHeaderRow,
): Promise<CurrentWeekShoppingListSnapshot | null> {
  if (!hasPublishedShoppingListBaseline(shoppingList)) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("shopping_list_items")
    .select(
      "id, ingredient_name, normalized_name, quantity, unit, source_type, is_checked, product_id, source_key",
    )
    .eq("shopping_list_id", shoppingList.id)
    .order("is_checked", { ascending: true })
    .order("source_type", { ascending: true })
    .order("ingredient_name", { ascending: true });

  if (error) {
    throw error;
  }

  return {
    shoppingListId: shoppingList.id,
    mealPlanId: shoppingList.meal_plan_id,
    generatedAt: shoppingList.generated_at ?? undefined,
    lastSyncedAt: shoppingList.last_synced_at ?? undefined,
    lastSourceChangeAt: shoppingList.last_source_change_at,
    needsResync: shoppingList.needs_resync,
    items: ((data ?? []) as ShoppingListItemRow[]).map((item) => ({
      id: item.id,
      ingredientName: item.ingredient_name,
      normalizedName: item.normalized_name,
      quantity: formatQuantity(item.quantity),
      unit: item.unit,
      sourceType: item.source_type,
      isChecked: item.is_checked,
      productId: item.product_id,
      sourceKey: item.source_key,
    })),
  };
}

export async function fetchCurrentWeekPublishedShoppingListPageData(): Promise<CurrentWeekShoppingListPageData> {
  const mealPlan = await fetchCurrentWeekMealPlanReadContext();

  if (!mealPlan) {
    return {
      hasMealPlan: false,
      snapshot: null,
      status: null,
      isSyncPending: false,
    };
  }

  const shoppingList = await fetchShoppingListReadHeaderByMealPlanId(mealPlan.id);
  const status = mapShoppingListReadStatus(shoppingList);

  return {
    hasMealPlan: true,
    snapshot: shoppingList ? await fetchPublishedShoppingListSnapshot(shoppingList) : null,
    status,
    isSyncPending: isReadPending(status),
  };
}

export async function fetchCurrentWeekShoppingListBridgeSummary(): Promise<CurrentWeekShoppingListSummary | null> {
  const mealPlan = await fetchCurrentWeekMealPlanReadContext();

  if (!mealPlan) {
    return null;
  }

  const shoppingList = await fetchShoppingListReadHeaderByMealPlanId(mealPlan.id);
  const status = mapShoppingListReadStatus(shoppingList);
  const counts =
    shoppingList && status.hasPublishedBaseline
      ? await fetchPublishedShoppingListCounts(shoppingList.id)
      : {
          totalItems: 0,
          toBuyCount: 0,
        };

  return {
    totalItems: counts.totalItems,
    toBuyCount: counts.toBuyCount,
    boughtCount: counts.totalItems - counts.toBuyCount,
    isSyncPending: isReadPending(status),
    freshnessState: status.freshnessState,
    hasPublishedBaseline: status.hasPublishedBaseline,
  };
}

export async function fetchCurrentWeekPublishedShoppingListItem(
  itemId: string,
): Promise<EditableShoppingListItem | null> {
  const mealPlan = await fetchCurrentWeekMealPlanReadContext();

  if (!mealPlan) {
    return null;
  }

  const shoppingList = await fetchShoppingListReadHeaderByMealPlanId(mealPlan.id);

  if (!shoppingList || !hasPublishedShoppingListBaseline(shoppingList)) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("shopping_list_items")
    .select(
      "id, shopping_list_id, ingredient_name, normalized_name, quantity, unit, source_type, is_checked, product_id, source_key",
    )
    .eq("shopping_list_id", shoppingList.id)
    .eq("id", itemId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const item = data as ShoppingListItemRow;

  return {
    id: item.id,
    shoppingListId: item.shopping_list_id,
    ingredientName: item.ingredient_name,
    normalizedName: item.normalized_name,
    quantity: formatQuantity(item.quantity),
    unit: item.unit,
    sourceType: item.source_type,
    isChecked: item.is_checked,
    productId: item.product_id,
    sourceKey: item.source_key,
  };
}
