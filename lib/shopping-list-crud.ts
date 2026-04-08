import "server-only";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import type { IngredientUnit } from "@/lib/dish-form";
import {
  formatSourceVersionForWrite,
  getAuthoritativeMealPlanSourceVersion,
  getPublishedShoppingListSourceVersion,
  hasPublishedShoppingListBaseline,
  isShoppingListFreshnessState,
  mealPlanSourceAuthorityColumn,
  shoppingListControlPlaneSelect,
  type MealPlanSourceAuthorityRow,
  type ShoppingListControlPlaneRow,
  type ShoppingListFreshnessState,
} from "@/lib/shopping-list-authority";
import {
  buildShoppingListContributionKey,
  buildShoppingListSourceKey,
  getShoppingListNormalizedName,
  isSlotItemAwareContributionKey,
  type ShoppingListAdjustmentType,
  type ShoppingListSlotCoordinate,
  type ShoppingListSourceType,
} from "@/lib/shopping-list";
import {
  buildWeeklyMenuSlotItemLineageKey,
  getCurrentWeekRange,
  isMealType,
  type MealType,
} from "@/lib/weekly-menu";
import { getCurrentFamilyId, getSupabaseServerClient } from "@/lib/supabase/server";

type MealPlanRow = {
  id: string;
  family_id: string;
  start_date: string;
  end_date: string;
};

type MealPlanSlotRow = {
  id: string;
  meal_plan_id: string;
  day_index: number;
  meal_type: string;
  dish_id: string;
};

type MealPlanSlotItemRow = {
  id: string;
  slot_id: string;
  dish_id: string;
  sort_order: number;
};

type DishIngredientRow = {
  dish_id: string;
  ingredient_name: string;
  quantity: number | string;
  unit: IngredientUnit;
  product_id: string | null;
};

type ProductRow = {
  id: string;
  display_name: string;
  normalized_name: string;
};

type ProductAliasRow = {
  product_id: string;
  normalized_name: string;
};

type ShoppingListLegacyFreshnessRow = {
  id: string;
  meal_plan_id: string;
  generated_at: string | null;
  last_synced_at: string | null;
  last_source_change_at: string;
  needs_resync: boolean;
};

// Slice 1 compatibility note:
// The legacy freshness fields below still drive today's synchronous recompute behavior.
// The co-located control-plane fields are the forward-looking authority model, but they are
// intentionally not the runtime switch for this slice.
type ShoppingListRow = ShoppingListLegacyFreshnessRow & ShoppingListControlPlaneRow;

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

type ShoppingListContributionRow = {
  id: string;
  shopping_list_id: string;
  meal_plan_id: string;
  contribution_key: string;
  source_key: string;
  day_index: number;
  meal_type: MealType;
  dish_id: string;
  product_id: string | null;
  ingredient_name: string;
  normalized_name: string;
  quantity: number | string;
  unit: IngredientUnit;
};

type ShoppingListAdjustmentRow = {
  id: string;
  shopping_list_id: string;
  source_key: string;
  adjustment_type: ShoppingListAdjustmentType;
  ingredient_name: string | null;
  normalized_name: string | null;
  product_id: string | null;
  quantity: number | string | null;
  unit: IngredientUnit | null;
};

type SlotContributionDraft = {
  contributionKey: string;
  sourceKey: string;
  slotItemKey: string;
  dayIndex: number;
  mealType: MealType;
  dishId: string;
  productId: string | null;
  ingredientName: string;
  normalizedName: string;
  quantity: number;
  unit: IngredientUnit;
};

type ShoppingListItemSnapshot = {
  id: string;
  ingredientName: string;
  normalizedName: string | null;
  quantity: string;
  unit: IngredientUnit;
  sourceType: ShoppingListSourceType;
  isChecked: boolean;
  productId: string | null;
  sourceKey: string | null;
};

const SHOPPING_LIST_SYNC_TIMEOUT_MS = 5000;
const SHOPPING_LIST_EXECUTOR_LEASE_MS = 15000;
const SHOPPING_LIST_EXECUTOR_RECLAIM_DELAY_MS =
  SHOPPING_LIST_EXECUTOR_LEASE_MS + 250;
const SHOPPING_LIST_LEGACY_FRESHNESS_SELECT =
  "generated_at, last_synced_at, last_source_change_at, needs_resync";
const SHOPPING_LIST_SELECT = [
  "id",
  "meal_plan_id",
  SHOPPING_LIST_LEGACY_FRESHNESS_SELECT,
  shoppingListControlPlaneSelect,
].join(", ");

export type CurrentWeekShoppingListSnapshot = {
  shoppingListId: string;
  mealPlanId: string;
  generatedAt?: string;
  lastSyncedAt?: string;
  lastSourceChangeAt: string;
  needsResync: boolean;
  items: ShoppingListItemSnapshot[];
};

export type CurrentWeekShoppingListSummary = {
  totalItems: number;
  toBuyCount: number;
  boughtCount: number;
  isSyncPending: boolean;
};

export type CurrentWeekShoppingListPageData = {
  hasMealPlan: boolean;
  snapshot: CurrentWeekShoppingListSnapshot | null;
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

type SyncScope =
  | { type: "full" }
  | { type: "slots"; slots: ShoppingListSlotCoordinate[] };

type ProjectedAutoItemRow = {
  shopping_list_id: string;
  ingredient_name: string;
  normalized_name: string;
  quantity: number;
  unit: IngredientUnit;
  source_type: ShoppingListSourceType;
  is_checked: boolean;
  product_id: string | null;
  source_key: string;
};

type CandidateBaseProjection = {
  mealPlanId: string;
  scope: SyncScope;
  nextContributionDrafts: SlotContributionDraft[];
};

type ContinuityOverlayAssemblyInput = {
  shoppingListId: string;
  sourceKeys: string[];
  fallbackContributionDrafts?: SlotContributionDraft[];
  replacementContributionKeys?: string[];
};

type VisibleAutoMaterializationPlan = {
  shoppingListId: string;
  upsertRows: ProjectedAutoItemRow[];
  deleteSourceKeys: string[];
};

type GuardedPublishPlan = {
  shoppingListId: string;
  nextContributionRows: Array<{
    shopping_list_id: string;
    meal_plan_id: string;
    contribution_key: string;
    source_key: string;
    day_index: number;
    meal_type: MealType;
    dish_id: string;
    product_id: string | null;
    ingredient_name: string;
    normalized_name: string;
    quantity: number;
    unit: IngredientUnit;
  }>;
};

type ShoppingListClaimRpcRow = {
  claimed: boolean;
  claim_target_version: string | number | bigint | null;
};

type ShoppingListClaimResult =
  | {
      claimed: false;
    }
  | {
      claimed: true;
      claimToken: string;
      claimTargetVersion: bigint;
    };

type MealPlanSourceChangeRpcRow = {
  shopping_list_id: string;
  source_version: string | number | bigint;
  freshness_state: ShoppingListFreshnessState;
};

function parseQuantity(value: number | string | null | undefined) {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatQuantity(value: number | string) {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? `${numericValue}` : "";
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function uniqueSlots(slots: ShoppingListSlotCoordinate[]) {
  const seen = new Set<string>();

  return slots.filter((slot) => {
    const key = `${slot.dayIndex}:${slot.mealType}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function selectSlotsForSyncScope(
  slots: Awaited<ReturnType<typeof fetchMealPlanSlots>>,
  scope: SyncScope,
) {
  if (scope.type === "full") {
    return slots;
  }

  return slots.filter((slot) =>
    scope.slots.some(
      (targetSlot) =>
        targetSlot.dayIndex === slot.dayIndex && targetSlot.mealType === slot.mealType,
    ),
  );
}

function buildContributionSlotScopeFilter(slots: ShoppingListSlotCoordinate[]) {
  const uniqueScopedSlots = uniqueSlots(slots);

  if (uniqueScopedSlots.length === 0) {
    return null;
  }

  return uniqueScopedSlots
    .map((slot) => `and(day_index.eq.${slot.dayIndex},meal_type.eq.${slot.mealType})`)
    .join(",");
}

function isShoppingListStale(list: ShoppingListRow | null) {
  // Legacy path only: later slices will cut reads over to the authority/control model.
  if (!list) {
    return true;
  }

  if (list.needs_resync || !list.last_synced_at) {
    return true;
  }

  return new Date(list.last_source_change_at) > new Date(list.last_synced_at);
}

class ShoppingListFreshnessTimeoutError extends Error {
  constructor() {
    super("Shopping list freshness sync timed out.");
    this.name = "ShoppingListFreshnessTimeoutError";
  }
}

async function awaitWithTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new ShoppingListFreshnessTimeoutError());
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function assertMealTypeValue(value: string): MealType {
  if (!isMealType(value)) {
    throw new Error(`Invalid meal type: ${value}`);
  }

  return value;
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
    .select("id, family_id, start_date, end_date")
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
    .select("id, family_id, start_date, end_date")
    .eq("family_id", familyId)
    .eq("start_date", weekRange.startDate)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingMealPlan) {
    return existingMealPlan as MealPlanRow;
  }

  const { data: createdMealPlan, error: createError } = await supabase
    .from("meal_plans")
    .insert({
      family_id: familyId,
      start_date: weekRange.startDate,
      end_date: weekRange.endDate,
    })
    .select("id, family_id, start_date, end_date")
    .single();

  if (!createError) {
    return createdMealPlan as MealPlanRow;
  }

  if (createError.code !== "23505") {
    throw createError;
  }

  const { data: retriedMealPlan, error: retryError } = await supabase
    .from("meal_plans")
    .select("id, family_id, start_date, end_date")
    .eq("family_id", familyId)
    .eq("start_date", weekRange.startDate)
    .single();

  if (retryError) {
    throw retryError;
  }

  return retriedMealPlan as MealPlanRow;
}

async function fetchMealPlanSourceAuthority(mealPlanId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("meal_plans")
    .select(mealPlanSourceAuthorityColumn)
    .eq("id", mealPlanId)
    .single();

  if (error) {
    throw error;
  }

  return data as MealPlanSourceAuthorityRow;
}

async function fetchShoppingListAuthorityContext(shoppingListId: string) {
  const shoppingList = await fetchShoppingListById(shoppingListId);
  const mealPlanSourceAuthority = await fetchMealPlanSourceAuthority(
    shoppingList.meal_plan_id,
  );

  return {
    shoppingList,
    currentSourceVersion: getAuthoritativeMealPlanSourceVersion(
      mealPlanSourceAuthority,
    ),
  };
}

async function fetchShoppingListByMealPlanId(mealPlanId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("shopping_lists")
    .select(SHOPPING_LIST_SELECT)
    .eq("meal_plan_id", mealPlanId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const shoppingList = (data ?? null) as unknown as ShoppingListRow | null;

  if (shoppingList && !isShoppingListFreshnessState(shoppingList.freshness_state)) {
    throw new Error(`Invalid shopping list freshness state: ${shoppingList.freshness_state}`);
  }

  return shoppingList;
}

async function fetchShoppingListById(shoppingListId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("shopping_lists")
    .select(SHOPPING_LIST_SELECT)
    .eq("id", shoppingListId)
    .single();

  if (error) {
    throw error;
  }

  const shoppingList = data as unknown as ShoppingListRow;

  if (!isShoppingListFreshnessState(shoppingList.freshness_state)) {
    throw new Error(`Invalid shopping list freshness state: ${shoppingList.freshness_state}`);
  }

  return shoppingList;
}

async function ensureShoppingListByMealPlanId(mealPlanId: string) {
  const supabase = getSupabaseServerClient();
  const existingList = await fetchShoppingListByMealPlanId(mealPlanId);

  if (existingList) {
    return existingList;
  }

  const { data: createdList, error: createError } = await supabase
    .from("shopping_lists")
    .insert({
      meal_plan_id: mealPlanId,
      last_source_change_at: new Date().toISOString(),
      needs_resync: true,
    })
    .select(SHOPPING_LIST_SELECT)
    .single();

  if (!createError) {
    return createdList as unknown as ShoppingListRow;
  }

  if (createError.code !== "23505") {
    throw createError;
  }

  const retriedList = await fetchShoppingListByMealPlanId(mealPlanId);

  if (!retriedList) {
    throw new Error("Shopping list header could not be created");
  }

  return retriedList;
}

function isClaimLeaseLive(shoppingList: ShoppingListControlPlaneRow) {
  return (
    shoppingList.claim_token !== null &&
    shoppingList.claim_expires_at !== null &&
    new Date(shoppingList.claim_expires_at).getTime() > Date.now()
  );
}

function getClaimlessFreshnessState(args: {
  shoppingList: ShoppingListControlPlaneRow;
  currentSourceVersion: bigint;
}): ShoppingListFreshnessState {
  const publishedSourceVersion = getPublishedShoppingListSourceVersion(
    args.shoppingList,
  );

  if (
    publishedSourceVersion !== null &&
    publishedSourceVersion === args.currentSourceVersion
  ) {
    return "fresh";
  }

  return hasPublishedShoppingListBaseline(args.shoppingList)
    ? "stale_pending"
    : "no_projection";
}

function formatShoppingListFailureReason(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }

  return "Unknown shopping recompute failure.";
}

async function tryClaimShoppingListRecompute(
  shoppingListId: string,
): Promise<ShoppingListClaimResult> {
  const supabase = getSupabaseServerClient();
  const claimToken = randomUUID();
  const claimExpiresAt = new Date(
    Date.now() + SHOPPING_LIST_EXECUTOR_LEASE_MS,
  ).toISOString();
  const { data, error } = await supabase.rpc("claim_shopping_list_recompute", {
    target_shopping_list_id: shoppingListId,
    next_claim_token: claimToken,
    next_claim_expires_at: claimExpiresAt,
  });

  if (error) {
    throw error;
  }

  const claimRow = ((data ?? []) as ShoppingListClaimRpcRow[])[0];

  if (!claimRow?.claimed || claimRow.claim_target_version === null) {
    return {
      claimed: false,
    };
  }

  return {
    claimed: true,
    claimToken,
    claimTargetVersion: getAuthoritativeMealPlanSourceVersion({
      source_version: claimRow.claim_target_version,
    }),
  };
}

async function fetchMealPlanSlots(mealPlanId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("meal_plan_slots")
    .select("id, meal_plan_id, day_index, meal_type, dish_id")
    .eq("meal_plan_id", mealPlanId);

  if (error) {
    throw error;
  }

  const slotRows = (data ?? []) as MealPlanSlotRow[];

  if (slotRows.length === 0) {
    return [];
  }

  const { data: itemData, error: itemError } = await supabase
    .from("meal_plan_slot_items")
    .select("id, slot_id, dish_id, sort_order")
    .in(
      "slot_id",
      slotRows.map((slot) => slot.id),
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (itemError) {
    if (isMissingSlotItemStorageError(itemError)) {
      return slotRows.map((slot) => ({
        slotId: slot.id,
        slotItemKey: buildWeeklyMenuSlotItemLineageKey({
          slotId: slot.id,
          dayIndex: slot.day_index,
          mealType: assertMealTypeValue(slot.meal_type),
          dishId: slot.dish_id,
          sortOrder: 0,
        }),
        mealPlanId: slot.meal_plan_id,
        dayIndex: slot.day_index,
        mealType: assertMealTypeValue(slot.meal_type),
        dishId: slot.dish_id,
      }));
    }

    throw itemError;
  }

  const itemsBySlotId = new Map<string, MealPlanSlotItemRow[]>();

  for (const item of (itemData ?? []) as MealPlanSlotItemRow[]) {
    const currentItems = itemsBySlotId.get(item.slot_id) ?? [];
    currentItems.push(item);
    itemsBySlotId.set(item.slot_id, currentItems);
  }

  return slotRows.flatMap((slot) => {
    const mealType = assertMealTypeValue(slot.meal_type);
    const persistedItems = itemsBySlotId.get(slot.id) ?? [];

    if (persistedItems.length === 0) {
      return [
        {
          slotId: slot.id,
          slotItemKey: buildWeeklyMenuSlotItemLineageKey({
            slotId: slot.id,
            dayIndex: slot.day_index,
            mealType,
            dishId: slot.dish_id,
            sortOrder: 0,
          }),
          mealPlanId: slot.meal_plan_id,
          dayIndex: slot.day_index,
          mealType,
          dishId: slot.dish_id,
        },
      ];
    }

    return persistedItems.map((item) => ({
      slotId: slot.id,
      slotItemKey: buildWeeklyMenuSlotItemLineageKey({
        slotItemId: item.id,
        slotId: slot.id,
        dayIndex: slot.day_index,
        mealType,
        dishId: item.dish_id,
        sortOrder: item.sort_order,
      }),
      mealPlanId: slot.meal_plan_id,
      dayIndex: slot.day_index,
      mealType,
      dishId: item.dish_id,
    }));
  });
}

function hasMatchingDishIds(actualDishIds: string[], expectedDishIds: string[]) {
  if (actualDishIds.length !== expectedDishIds.length) {
    return false;
  }

  const sortedActualDishIds = [...actualDishIds].sort();
  const sortedExpectedDishIds = [...expectedDishIds].sort();

  return sortedActualDishIds.every((dishId, index) => dishId === sortedExpectedDishIds[index]);
}

export async function waitForMealPlanSlotSourceVisibility(args: {
  mealPlanId: string;
  targets: Array<{
    dayIndex: number;
    mealType: MealType;
    expectedDishIds: string[];
  }>;
  maxAttempts?: number;
  delayMs?: number;
}) {
  const maxAttempts = Math.max(args.maxAttempts ?? 6, 1);
  const delayMs = Math.max(args.delayMs ?? 40, 0);
  let lastSlots: Awaited<ReturnType<typeof fetchMealPlanSlots>> = [];
  let allTargetsVisible = false;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    lastSlots = await fetchMealPlanSlots(args.mealPlanId);
    allTargetsVisible = args.targets.every((target) => {
      const actualDishIds = lastSlots
        .filter(
          (slot) =>
            slot.dayIndex === target.dayIndex && slot.mealType === target.mealType,
        )
        .map((slot) => slot.dishId);

      return hasMatchingDishIds(actualDishIds, target.expectedDishIds);
    });

    if (allTargetsVisible) {
      return lastSlots;
    }

    if (attempt < maxAttempts - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return allTargetsVisible ? lastSlots : undefined;
}

async function fetchDishIngredientsByDishIds(dishIds: string[]) {
  if (dishIds.length === 0) {
    return new Map<string, DishIngredientRow[]>();
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("dish_ingredients")
    .select("dish_id, ingredient_name, quantity, unit, product_id")
    .in("dish_id", dishIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const ingredientsByDishId = new Map<string, DishIngredientRow[]>();

  for (const ingredient of (data ?? []) as DishIngredientRow[]) {
    const currentIngredients = ingredientsByDishId.get(ingredient.dish_id) ?? [];
    currentIngredients.push(ingredient);
    ingredientsByDishId.set(ingredient.dish_id, currentIngredients);
  }

  return ingredientsByDishId;
}

async function fetchProductResolutionMaps() {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();

  const [productsResult, aliasesResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, display_name, normalized_name")
      .eq("family_id", familyId),
    supabase
      .from("product_aliases")
      .select("product_id, normalized_name")
      .eq("family_id", familyId),
  ]);

  if (productsResult.error) {
    throw productsResult.error;
  }

  if (aliasesResult.error) {
    throw aliasesResult.error;
  }

  const products = (productsResult.data ?? []) as ProductRow[];
  const aliases = (aliasesResult.data ?? []) as ProductAliasRow[];
  const productsById = new Map(products.map((product) => [product.id, product]));
  const productsByNormalizedName = new Map(
    products.map((product) => [product.normalized_name, product]),
  );
  const productsByAliasNormalizedName = new Map<string, ProductRow>();

  for (const alias of aliases) {
    const product = productsById.get(alias.product_id);

    if (product) {
      productsByAliasNormalizedName.set(alias.normalized_name, product);
    }
  }

  return {
    productsById,
    productsByNormalizedName,
    productsByAliasNormalizedName,
  };
}

function resolveIngredientIdentity(
  ingredient: DishIngredientRow,
  productMaps: Awaited<ReturnType<typeof fetchProductResolutionMaps>>,
) {
  const rawIngredientName = ingredient.ingredient_name.trim();
  const rawNormalizedName =
    getShoppingListNormalizedName(rawIngredientName) || rawIngredientName.toLowerCase();
  const linkedProduct = ingredient.product_id
    ? productMaps.productsById.get(ingredient.product_id)
    : undefined;
  const exactResolvedProduct =
    linkedProduct
    ?? productMaps.productsByNormalizedName.get(rawNormalizedName)
    ?? productMaps.productsByAliasNormalizedName.get(rawNormalizedName);
  const productId = exactResolvedProduct?.id ?? ingredient.product_id ?? null;
  const ingredientName = exactResolvedProduct?.display_name ?? rawIngredientName;
  const normalizedName =
    exactResolvedProduct?.normalized_name
    ?? rawNormalizedName;

  return {
    productId,
    ingredientName,
    normalizedName,
  };
}


function buildSlotContributionDrafts(args: {
  mealPlanId: string;
  slot: Awaited<ReturnType<typeof fetchMealPlanSlots>>[number];
  dishIngredients: DishIngredientRow[];
  productMaps: Awaited<ReturnType<typeof fetchProductResolutionMaps>>;
}) {
  const groupedContributions = new Map<string, SlotContributionDraft>();

  for (const ingredient of args.dishIngredients) {
    const quantity = parseQuantity(ingredient.quantity);

    if (quantity <= 0) {
      continue;
    }

    const resolvedIdentity = resolveIngredientIdentity(ingredient, args.productMaps);
    const sourceKey = buildShoppingListSourceKey({
      mealPlanId: args.mealPlanId,
      productId: resolvedIdentity.productId,
      normalizedName: resolvedIdentity.normalizedName,
      unit: ingredient.unit,
    });
    const contributionKey = buildShoppingListContributionKey({
      mealPlanId: args.mealPlanId,
      dayIndex: args.slot.dayIndex,
      mealType: args.slot.mealType,
      slotItemKey: args.slot.slotItemKey,
      productId: resolvedIdentity.productId,
      normalizedName: resolvedIdentity.normalizedName,
      unit: ingredient.unit,
    });
    const existingContribution = groupedContributions.get(contributionKey);

    if (existingContribution) {
      existingContribution.quantity += quantity;
      if (resolvedIdentity.productId && !existingContribution.productId) {
        existingContribution.productId = resolvedIdentity.productId;
        existingContribution.ingredientName = resolvedIdentity.ingredientName;
        existingContribution.normalizedName = resolvedIdentity.normalizedName;
      }
      continue;
    }

    groupedContributions.set(contributionKey, {
      contributionKey,
      sourceKey,
      slotItemKey: args.slot.slotItemKey,
      dayIndex: args.slot.dayIndex,
      mealType: args.slot.mealType,
      dishId: args.slot.dishId,
      productId: resolvedIdentity.productId,
      ingredientName: resolvedIdentity.ingredientName,
      normalizedName: resolvedIdentity.normalizedName,
      quantity,
      unit: ingredient.unit,
    });
  }

  return [...groupedContributions.values()];
}

async function computeCandidateBaseProjection(args: {
  mealPlanId: string;
  scope: SyncScope;
  prefetchedSlots?: Awaited<ReturnType<typeof fetchMealPlanSlots>>;
}): Promise<CandidateBaseProjection> {
  const [slots, productMaps] = await Promise.all([
    args.prefetchedSlots
      ? Promise.resolve(args.prefetchedSlots)
      : fetchMealPlanSlots(args.mealPlanId),
    fetchProductResolutionMaps(),
  ]);
  const targetSlots = selectSlotsForSyncScope(slots, args.scope);
  const targetDishIds = uniqueStrings(targetSlots.map((slot) => slot.dishId));
  const dishIngredientsByDishId = await fetchDishIngredientsByDishIds(targetDishIds);
  const nextContributionDrafts = targetSlots.flatMap((slot) =>
    buildSlotContributionDrafts({
      mealPlanId: args.mealPlanId,
      slot,
      dishIngredients: dishIngredientsByDishId.get(slot.dishId) ?? [],
      productMaps,
    }),
  );

  return {
    mealPlanId: args.mealPlanId,
    scope: args.scope,
    nextContributionDrafts,
  };
}

async function fetchContributionRowsForShoppingList(
  shoppingListId: string,
  options?: {
    sourceKeys?: string[];
    scope?: SyncScope;
  },
) {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("shopping_list_item_contributions")
    .select(
      "id, shopping_list_id, meal_plan_id, contribution_key, source_key, day_index, meal_type, dish_id, product_id, ingredient_name, normalized_name, quantity, unit",
    )
    .eq("shopping_list_id", shoppingListId);

  if (options?.sourceKeys && options.sourceKeys.length > 0) {
    query = query.in("source_key", uniqueStrings(options.sourceKeys));
  }

  if (options?.scope?.type === "slots") {
    const slotScopeFilter = buildContributionSlotScopeFilter(options.scope.slots);

    if (slotScopeFilter) {
      query = query.or(slotScopeFilter);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return ((data ?? []) as ShoppingListContributionRow[]).map((row) => ({
    ...row,
    meal_type: assertMealTypeValue(row.meal_type),
  }));
}

async function hasLegacyContributionIdentityRows(shoppingListId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("shopping_list_item_contributions")
    .select("contribution_key")
    .eq("shopping_list_id", shoppingListId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as Array<{ contribution_key: string }>).some(
    (row) => !isSlotItemAwareContributionKey(row.contribution_key),
  );
}

async function fetchAutoItemRows(shoppingListId: string, sourceKeys: string[]) {
  if (sourceKeys.length === 0) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("shopping_list_items")
    .select(
      "id, shopping_list_id, ingredient_name, normalized_name, quantity, unit, source_type, is_checked, product_id, source_key",
    )
    .eq("shopping_list_id", shoppingListId)
    .eq("source_type", "auto")
    .in("source_key", sourceKeys);

  if (error) {
    throw error;
  }

  return (data ?? []) as ShoppingListItemRow[];
}

async function fetchAdjustmentRows(shoppingListId: string, sourceKeys: string[]) {
  if (sourceKeys.length === 0) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("shopping_list_item_adjustments")
    .select(
      "id, shopping_list_id, source_key, adjustment_type, ingredient_name, normalized_name, product_id, quantity, unit",
    )
    .eq("shopping_list_id", shoppingListId)
    .in("source_key", sourceKeys);

  if (error) {
    throw error;
  }

  return (data ?? []) as ShoppingListAdjustmentRow[];
}

function pickProjectionIngredientName(contributions: ShoppingListContributionRow[]) {
  const nonCanonicalNames = uniqueStrings(contributions.map((contribution) => contribution.ingredient_name))
    .sort((left, right) => left.localeCompare(right));

  return nonCanonicalNames[0] ?? "Item";
}

function areProjectedAutoRowsSemanticallyEqual(
  existingRow: ShoppingListItemRow,
  projectedRow: ProjectedAutoItemRow,
) {
  // Semantic no-op equality for derived auto rows; review if the derived payload changes.
  return (
    existingRow.ingredient_name === projectedRow.ingredient_name &&
    existingRow.normalized_name === projectedRow.normalized_name &&
    parseQuantity(existingRow.quantity) === parseQuantity(projectedRow.quantity) &&
    existingRow.unit === projectedRow.unit &&
    existingRow.product_id === projectedRow.product_id
  );
}

async function assembleContinuityOverlayPlan(
  args: ContinuityOverlayAssemblyInput,
): Promise<VisibleAutoMaterializationPlan> {
  const sourceKeys = uniqueStrings(args.sourceKeys);

  if (sourceKeys.length === 0) {
    return {
      shoppingListId: args.shoppingListId,
      upsertRows: [],
      deleteSourceKeys: [],
    };
  }

  const [contributions, adjustments, existingAutoItems] = await Promise.all([
    fetchContributionRowsForShoppingList(args.shoppingListId, {
      sourceKeys,
    }),
    fetchAdjustmentRows(args.shoppingListId, sourceKeys),
    fetchAutoItemRows(args.shoppingListId, sourceKeys),
  ]);
  const contributionsBySourceKey = new Map<string, ShoppingListContributionRow[]>();
  const fallbackContributionsBySourceKey = new Map<string, ShoppingListContributionRow[]>();
  const existingAutoItemsBySourceKey = new Map<string, ShoppingListItemRow>();
  const adjustmentsBySourceKey = new Map<string, ShoppingListAdjustmentRow>();
  const replacementContributionKeySet = new Set(args.replacementContributionKeys ?? []);

  for (const contribution of contributions) {
    if (!sourceKeys.includes(contribution.source_key)) {
      continue;
    }

    const currentContributions = contributionsBySourceKey.get(contribution.source_key) ?? [];
    currentContributions.push(contribution);
    contributionsBySourceKey.set(contribution.source_key, currentContributions);
  }

  for (const draft of args.fallbackContributionDrafts ?? []) {
    if (!sourceKeys.includes(draft.sourceKey)) {
      continue;
    }

    const currentContributions = fallbackContributionsBySourceKey.get(draft.sourceKey) ?? [];
    currentContributions.push({
      id: `draft:${draft.contributionKey}`,
      shopping_list_id: args.shoppingListId,
      meal_plan_id: "",
      contribution_key: draft.contributionKey,
      source_key: draft.sourceKey,
      day_index: draft.dayIndex,
      meal_type: draft.mealType,
      dish_id: draft.dishId,
      product_id: draft.productId,
      ingredient_name: draft.ingredientName,
      normalized_name: draft.normalizedName,
      quantity: draft.quantity,
      unit: draft.unit,
    });
    fallbackContributionsBySourceKey.set(draft.sourceKey, currentContributions);
  }

  for (const autoItem of existingAutoItems) {
    if (autoItem.source_key) {
      existingAutoItemsBySourceKey.set(autoItem.source_key, autoItem);
    }
  }

  for (const adjustment of adjustments) {
    adjustmentsBySourceKey.set(adjustment.source_key, adjustment);
  }

  const upsertRows: ProjectedAutoItemRow[] = [];
  const deleteSourceKeys: string[] = [];

  for (const sourceKey of sourceKeys) {
    const persistedContributions = contributionsBySourceKey.get(sourceKey) ?? [];
    const fallbackContributions = fallbackContributionsBySourceKey.get(sourceKey) ?? [];
    // Supabase writes can be briefly non-monotonic for an immediate read-after-write.
    // Rebuild the current scope from fresh in-memory drafts, but keep unaffected persisted
    // contributions so shared source keys still materialize from the full aggregate.
    const groupedContributions = [
      ...persistedContributions.filter(
        (contribution) => !replacementContributionKeySet.has(contribution.contribution_key),
      ),
      ...fallbackContributions,
    ];
    const adjustment = adjustmentsBySourceKey.get(sourceKey);
    const existingItem = existingAutoItemsBySourceKey.get(sourceKey);
    const quantity = groupedContributions.reduce(
      (sum, contribution) => sum + parseQuantity(contribution.quantity),
      0,
    );

    if (adjustment?.adjustment_type === "suppress" || groupedContributions.length === 0) {
      if (existingItem) {
        deleteSourceKeys.push(sourceKey);
      }
      continue;
    }

    const firstContribution = groupedContributions[0];
    const overrideQuantity = parseQuantity(adjustment?.quantity);

    const projectedRow: ProjectedAutoItemRow = {
      shopping_list_id: args.shoppingListId,
      ingredient_name:
        adjustment?.adjustment_type === "override" && adjustment.ingredient_name
          ? adjustment.ingredient_name
          : pickProjectionIngredientName(groupedContributions),
      normalized_name:
        adjustment?.adjustment_type === "override" && adjustment.normalized_name
          ? adjustment.normalized_name
          : firstContribution.normalized_name,
      quantity:
        adjustment?.adjustment_type === "override" && overrideQuantity > 0
          ? overrideQuantity
          : quantity,
      unit:
        adjustment?.adjustment_type === "override" && adjustment.unit
          ? adjustment.unit
          : firstContribution.unit,
      source_type: "auto",
      is_checked: existingItem?.is_checked ?? false,
      product_id:
        adjustment?.adjustment_type === "override"
          ? adjustment.product_id
          : firstContribution.product_id,
      source_key: sourceKey,
    };

    if (existingItem && areProjectedAutoRowsSemanticallyEqual(existingItem, projectedRow)) {
      continue;
    }

    upsertRows.push(projectedRow);
  }

  return {
    shoppingListId: args.shoppingListId,
    upsertRows,
    deleteSourceKeys,
  };
}

async function materializeVisibleAutoProjectionRows(plan: VisibleAutoMaterializationPlan) {
  const supabase = getSupabaseServerClient();

  if (plan.deleteSourceKeys.length > 0) {
    const { error: deleteError } = await supabase
      .from("shopping_list_items")
      .delete()
      .eq("shopping_list_id", plan.shoppingListId)
      .eq("source_type", "auto")
      .in("source_key", plan.deleteSourceKeys);

    if (deleteError) {
      throw deleteError;
    }
  }

  if (plan.upsertRows.length > 0) {
    const { error: upsertError } = await supabase.from("shopping_list_items").upsert(
      plan.upsertRows,
      {
        onConflict: "shopping_list_id,source_key",
      },
    );

    if (upsertError) {
      throw upsertError;
    }
  }
}

async function buildGuardedPublishPlan(args: {
  shoppingListId: string;
  candidateBaseProjection: CandidateBaseProjection;
}): Promise<GuardedPublishPlan> {
  return {
    shoppingListId: args.shoppingListId,
    nextContributionRows: args.candidateBaseProjection.nextContributionDrafts.map(
      (draft) => ({
        shopping_list_id: args.shoppingListId,
        meal_plan_id: args.candidateBaseProjection.mealPlanId,
        contribution_key: draft.contributionKey,
        source_key: draft.sourceKey,
        day_index: draft.dayIndex,
        meal_type: draft.mealType,
        dish_id: draft.dishId,
        product_id: draft.productId,
        ingredient_name: draft.ingredientName,
        normalized_name: draft.normalizedName,
        quantity: draft.quantity,
        unit: draft.unit,
      }),
    ),
  };
}

async function guardedPublishShoppingListProjection(args: {
  shoppingListId: string;
  claimToken: string;
  claimTargetVersion: bigint;
  publishPlan: GuardedPublishPlan;
}) {
  const supabase = getSupabaseServerClient();
  const publishedAt = new Date().toISOString();
  const { data, error } = await supabase.rpc(
    "guarded_publish_shopping_list_projection",
    {
      target_shopping_list_id: args.shoppingListId,
      expected_claim_token: args.claimToken,
      expected_claim_target_version: formatSourceVersionForWrite(
        args.claimTargetVersion,
      ),
      published_at: publishedAt,
      next_contributions: args.publishPlan.nextContributionRows,
    },
  );

  if (error) {
    throw error;
  }

  return Boolean(data);
}

// Legacy compatibility seam only:
// This persists the candidate base for the remaining mixed-mode synchronous path.
// The hardened weekly-menu path must not use this helper because candidate state is
// not allowed to become baseline authority outside guarded publish.
async function persistCandidateBaseProjection(args: {
  shoppingListId: string;
  candidateBaseProjection: CandidateBaseProjection;
}): Promise<ContinuityOverlayAssemblyInput> {
  const supabase = getSupabaseServerClient();
  const scopedExistingRows = await fetchContributionRowsForShoppingList(args.shoppingListId, {
    scope: args.candidateBaseProjection.scope,
  });
  const nextContributionKeys = new Set(
    args.candidateBaseProjection.nextContributionDrafts.map((draft) => draft.contributionKey),
  );
  const obsoleteContributionKeys = scopedExistingRows
    .map((row) => row.contribution_key)
    .filter((key) => !nextContributionKeys.has(key));
  const affectedSourceKeys = uniqueStrings([
    ...scopedExistingRows.map((row) => row.source_key),
    ...args.candidateBaseProjection.nextContributionDrafts.map((draft) => draft.sourceKey),
  ]);

  if (obsoleteContributionKeys.length > 0) {
    const { error: deleteError } = await supabase
      .from("shopping_list_item_contributions")
      .delete()
      .eq("shopping_list_id", args.shoppingListId)
      .in("contribution_key", obsoleteContributionKeys);

    if (deleteError) {
      throw deleteError;
    }
  }

  if (args.candidateBaseProjection.nextContributionDrafts.length > 0) {
    const { error: upsertError } = await supabase
      .from("shopping_list_item_contributions")
      .upsert(
        args.candidateBaseProjection.nextContributionDrafts.map((draft) => ({
          shopping_list_id: args.shoppingListId,
          meal_plan_id: args.candidateBaseProjection.mealPlanId,
          contribution_key: draft.contributionKey,
          source_key: draft.sourceKey,
          day_index: draft.dayIndex,
          meal_type: draft.mealType,
          dish_id: draft.dishId,
          product_id: draft.productId,
          ingredient_name: draft.ingredientName,
          normalized_name: draft.normalizedName,
          quantity: draft.quantity,
          unit: draft.unit,
        })),
        {
          onConflict: "shopping_list_id,contribution_key",
        },
      );

    if (upsertError) {
      throw upsertError;
    }
  }

  return {
    shoppingListId: args.shoppingListId,
    sourceKeys: affectedSourceKeys,
    fallbackContributionDrafts: args.candidateBaseProjection.nextContributionDrafts,
    replacementContributionKeys: uniqueStrings([
      ...scopedExistingRows.map((row) => row.contribution_key),
      ...args.candidateBaseProjection.nextContributionDrafts.map((draft) => draft.contributionKey),
    ]),
  };
}

async function advanceShoppingListControlStateAfterSuccessfulSync(shoppingListId: string) {
  const supabase = getSupabaseServerClient();
  const shoppingList = await fetchShoppingListById(shoppingListId);
  const mealPlanSourceAuthority = await fetchMealPlanSourceAuthority(shoppingList.meal_plan_id);
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("shopping_lists")
    .update({
      generated_at: now,
      last_synced_at: now,
      needs_resync: false,
      published_source_version: formatSourceVersionForWrite(
        getAuthoritativeMealPlanSourceVersion(mealPlanSourceAuthority),
      ),
      freshness_state: "fresh",
      recompute_requested_at: null,
      claim_token: null,
      claim_target_version: null,
      claim_expires_at: null,
      last_failure_at: null,
      last_failure_source_version: null,
      last_failure_reason: null,
    })
    .eq("id", shoppingListId);

  if (error) {
    throw error;
  }
}

async function runLegacyCompatibilityShoppingListRecompute(args: {
  shoppingListId: string;
  mealPlanId: string;
  scope: SyncScope;
  prefetchedSlots?: Awaited<ReturnType<typeof fetchMealPlanSlots>>;
}) {
  // Legacy compatibility pipeline only:
  // 1. compute candidate base projection from current meal-plan source state
  // 2. assemble continuity overlays on top of that candidate base
  // 3. materialize only the visible auto projection rows
  // 4. advance control-state fields after a successful synchronous publish
  const candidateBaseProjection = await computeCandidateBaseProjection({
    mealPlanId: args.mealPlanId,
    scope: args.scope,
    prefetchedSlots: args.prefetchedSlots,
  });
  // Compatibility step for the still-synchronous path: we continue persisting contribution rows
  // before visible auto materialization so the legacy partial-sync surface remains intact.
  const continuityOverlayInput = await persistCandidateBaseProjection({
    shoppingListId: args.shoppingListId,
    candidateBaseProjection,
  });
  const visibleAutoMaterializationPlan = await assembleContinuityOverlayPlan(
    continuityOverlayInput,
  );

  await materializeVisibleAutoProjectionRows(visibleAutoMaterializationPlan);
  await advanceShoppingListControlStateAfterSuccessfulSync(args.shoppingListId);
}

async function clearOwnedShoppingListClaim(args: {
  shoppingListId: string;
  claimToken: string;
}) {
  const supabase = getSupabaseServerClient();
  const { shoppingList, currentSourceVersion } =
    await fetchShoppingListAuthorityContext(args.shoppingListId);

  if (shoppingList.claim_token !== args.claimToken) {
    return false;
  }

  const nextFreshnessState = getClaimlessFreshnessState({
    shoppingList,
    currentSourceVersion,
  });
  const updatePayload: Record<string, string | null> = {
    claim_token: null,
    claim_target_version: null,
    claim_expires_at: null,
    freshness_state: nextFreshnessState,
  };

  if (nextFreshnessState === "fresh") {
    updatePayload.recompute_requested_at = null;
  }

  const { error } = await supabase
    .from("shopping_lists")
    .update(updatePayload)
    .eq("id", args.shoppingListId)
    .eq("claim_token", args.claimToken);

  if (error) {
    throw error;
  }

  return true;
}

async function recordOwnedShoppingListFailure(args: {
  shoppingListId: string;
  claimToken: string;
  claimTargetVersion: bigint;
  error: unknown;
}) {
  const supabase = getSupabaseServerClient();
  const { shoppingList, currentSourceVersion } =
    await fetchShoppingListAuthorityContext(args.shoppingListId);

  if (shoppingList.claim_token !== args.claimToken) {
    return false;
  }

  if (
    !isClaimLeaseLive(shoppingList) ||
    currentSourceVersion !== args.claimTargetVersion
  ) {
    return clearOwnedShoppingListClaim({
      shoppingListId: args.shoppingListId,
      claimToken: args.claimToken,
    });
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("shopping_lists")
    .update({
      freshness_state: "failed_latest",
      claim_token: null,
      claim_target_version: null,
      claim_expires_at: null,
      last_failure_at: now,
      last_failure_source_version: formatSourceVersionForWrite(
        args.claimTargetVersion,
      ),
      last_failure_reason: formatShoppingListFailureReason(args.error),
    })
    .eq("id", args.shoppingListId)
    .eq("claim_token", args.claimToken);

  if (error) {
    throw error;
  }

  return true;
}

async function runWeeklyMenuShoppingListControlPassByMealPlanId(mealPlanId: string) {
  const shoppingList = await ensureShoppingListByMealPlanId(mealPlanId);
  const claim = await tryClaimShoppingListRecompute(shoppingList.id);

  if (!claim.claimed) {
    return false;
  }

  try {
    const candidateBaseProjection = await computeCandidateBaseProjection({
      mealPlanId,
      scope: { type: "full" },
    });
    const publishPlan = await buildGuardedPublishPlan({
      shoppingListId: shoppingList.id,
      candidateBaseProjection,
    });
    const published = await guardedPublishShoppingListProjection({
      shoppingListId: shoppingList.id,
      claimToken: claim.claimToken,
      claimTargetVersion: claim.claimTargetVersion,
      publishPlan,
    });

    if (!published) {
      await clearOwnedShoppingListClaim({
        shoppingListId: shoppingList.id,
        claimToken: claim.claimToken,
      });
      return false;
    }

    revalidatePath("/products");
    return true;
  } catch (error) {
    await recordOwnedShoppingListFailure({
      shoppingListId: shoppingList.id,
      claimToken: claim.claimToken,
      claimTargetVersion: claim.claimTargetVersion,
      error,
    });
    throw error;
  }
}

async function runWeeklyMenuShoppingListControlPassSafely(mealPlanId: string) {
  try {
    await runWeeklyMenuShoppingListControlPassByMealPlanId(mealPlanId);
  } catch (error) {
    console.error(
      `Failed weekly-menu shopping control pass for meal plan ${mealPlanId}`,
      error,
    );
  }
}

export function scheduleWeeklyMenuShoppingListControlPass(mealPlanId: string) {
  void runWeeklyMenuShoppingListControlPassSafely(mealPlanId);

  // Best-effort local retry only. This is not a durable worker guarantee.
  setTimeout(() => {
    void runWeeklyMenuShoppingListControlPassSafely(mealPlanId);
  }, SHOPPING_LIST_EXECUTOR_RECLAIM_DELAY_MS);
}

export async function markShoppingListSourceChangedByMealPlanId(mealPlanId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.rpc("record_meal_plan_source_change", {
    target_meal_plan_id: mealPlanId,
  });

  if (error) {
    throw error;
  }

  const sourceChangeRow = ((data ?? []) as MealPlanSourceChangeRpcRow[])[0];

  if (!sourceChangeRow?.shopping_list_id) {
    throw new Error(
      `Meal plan ${mealPlanId} source change did not return a shopping list id.`,
    );
  }

  if (!isShoppingListFreshnessState(sourceChangeRow.freshness_state)) {
    throw new Error(
      `Invalid shopping list freshness state from source-change RPC: ${sourceChangeRow.freshness_state}`,
    );
  }

  return sourceChangeRow.shopping_list_id;
}

export async function markCurrentWeekShoppingListSourceChanged() {
  const { mealPlan } = await fetchCurrentWeekMealPlan();

  if (!mealPlan) {
    return null;
  }

  return markShoppingListSourceChangedByMealPlanId(mealPlan.id);
}

async function syncShoppingListByMealPlanIdLegacyCompatibility(
  mealPlanId: string,
  scope: SyncScope = { type: "full" },
  options?: {
    prefetchedSlots?: Awaited<ReturnType<typeof fetchMealPlanSlots>>;
  },
) {
  const shoppingList = await ensureShoppingListByMealPlanId(mealPlanId);
  await runLegacyCompatibilityShoppingListRecompute({
    shoppingListId: shoppingList.id,
    mealPlanId,
    scope,
    prefetchedSlots: options?.prefetchedSlots,
  });
  return shoppingList.id;
}

async function syncCurrentWeekShoppingListLegacyCompatibility(
  scope: SyncScope = { type: "full" },
) {
  const mealPlan = await ensureCurrentWeekMealPlan();
  await markShoppingListSourceChangedByMealPlanId(mealPlan.id);
  return syncShoppingListByMealPlanIdLegacyCompatibility(mealPlan.id, scope);
}

export async function syncShoppingListsForDish(dishId: string) {
  const supabase = getSupabaseServerClient();
  const [
    { data: slotData, error: slotError },
    { data: initialItemData, error: itemError },
  ] =
    await Promise.all([
      supabase
        .from("meal_plan_slots")
        .select("meal_plan_id, day_index, meal_type")
        .eq("dish_id", dishId),
      supabase
        .from("meal_plan_slot_items")
        .select("meal_plan_slots!inner(meal_plan_id, day_index, meal_type)")
        .eq("dish_id", dishId),
    ]);
  let itemData = initialItemData;

  if (slotError) {
    throw slotError;
  }

  if (itemError) {
    if (isMissingSlotItemStorageError(itemError)) {
      itemData = [];
    } else {
      throw itemError;
    }
  }

  const slotsByMealPlanId = new Map<string, ShoppingListSlotCoordinate[]>();

  for (const slot of (slotData ?? []) as MealPlanSlotRow[]) {
    const mealType = assertMealTypeValue(slot.meal_type);
    const currentSlots = slotsByMealPlanId.get(slot.meal_plan_id) ?? [];
    currentSlots.push({
      dayIndex: slot.day_index,
      mealType,
    });
    slotsByMealPlanId.set(slot.meal_plan_id, currentSlots);
  }

  for (const item of (itemData ?? []) as Array<{
    meal_plan_slots:
      | {
          meal_plan_id: string;
          day_index: number;
          meal_type: string;
        }
      | Array<{
          meal_plan_id: string;
          day_index: number;
          meal_type: string;
        }>;
  }>) {
    const slot = Array.isArray(item.meal_plan_slots)
      ? item.meal_plan_slots[0]
      : item.meal_plan_slots;

    if (!slot) {
      continue;
    }
    const mealType = assertMealTypeValue(slot.meal_type);
    const currentSlots = slotsByMealPlanId.get(slot.meal_plan_id) ?? [];
    currentSlots.push({
      dayIndex: slot.day_index,
      mealType,
    });
    slotsByMealPlanId.set(slot.meal_plan_id, currentSlots);
  }

  for (const [mealPlanId, slots] of slotsByMealPlanId) {
    await markShoppingListSourceChangedByMealPlanId(mealPlanId);
    await syncShoppingListByMealPlanIdLegacyCompatibility(mealPlanId, {
      type: "slots",
      slots: uniqueSlots(slots),
    });
  }
}

export async function ensureCurrentWeekShoppingListFresh() {
  const pageData = await fetchCurrentWeekShoppingListPageData();

  return pageData.snapshot;
}

async function fetchShoppingListSnapshotByMealPlanId(mealPlanId: string) {
  const shoppingList = await fetchShoppingListByMealPlanId(mealPlanId);

  if (!shoppingList) {
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
  } satisfies CurrentWeekShoppingListSnapshot;
}

export async function fetchCurrentWeekShoppingListPageData(): Promise<CurrentWeekShoppingListPageData> {
  const { mealPlan } = await fetchCurrentWeekMealPlan();

  if (!mealPlan) {
    return {
      hasMealPlan: false,
      snapshot: null,
      isSyncPending: false,
    };
  }

  const shoppingList = await fetchShoppingListByMealPlanId(mealPlan.id);

  const needsCompatibilityRefresh = shoppingList
    ? await hasLegacyContributionIdentityRows(shoppingList.id)
    : false;
  let isSyncPending = false;

  if (isShoppingListStale(shoppingList) || needsCompatibilityRefresh) {
    try {
      await awaitWithTimeout(
        syncShoppingListByMealPlanIdLegacyCompatibility(mealPlan.id, {
          type: "full",
        }),
        SHOPPING_LIST_SYNC_TIMEOUT_MS,
      );
    } catch (error) {
      if (!(error instanceof ShoppingListFreshnessTimeoutError)) {
        throw error;
      }

      isSyncPending = true;
    }
  }

  return {
    hasMealPlan: true,
    snapshot: await fetchShoppingListSnapshotByMealPlanId(mealPlan.id),
    isSyncPending,
  };
}

export async function fetchCurrentWeekShoppingListSnapshot() {
  const { mealPlan } = await fetchCurrentWeekMealPlan();

  if (!mealPlan) {
    return null;
  }

  return fetchShoppingListSnapshotByMealPlanId(mealPlan.id);
}

export async function fetchCurrentWeekShoppingListSummary(): Promise<CurrentWeekShoppingListSummary | null> {
  const pageData = await fetchCurrentWeekShoppingListPageData();

  if (!pageData.hasMealPlan) {
    return null;
  }

  const snapshot = pageData.snapshot;
  const totalItems = snapshot?.items.length ?? 0;
  const toBuyCount = snapshot?.items.filter((item) => !item.isChecked).length ?? 0;
  const boughtCount = totalItems - toBuyCount;

  return {
    totalItems,
    toBuyCount,
    boughtCount,
    isSyncPending: pageData.isSyncPending,
  };
}

export async function fetchCurrentWeekShoppingListItem(
  itemId: string,
): Promise<EditableShoppingListItem | null> {
  const { mealPlan } = await fetchCurrentWeekMealPlan();

  if (!mealPlan) {
    return null;
  }

  const shoppingList = await fetchShoppingListByMealPlanId(mealPlan.id);

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

export async function createManualCurrentWeekShoppingListItem(input: {
  ingredientName: string;
  quantity: number;
  unit: IngredientUnit;
  productId?: string | null;
}) {
  const supabase = getSupabaseServerClient();
  const mealPlan = await ensureCurrentWeekMealPlan();
  const shoppingList = await ensureShoppingListByMealPlanId(mealPlan.id);
  const normalizedName =
    getShoppingListNormalizedName(input.ingredientName) || input.ingredientName.trim().toLowerCase();

  const { error } = await supabase.from("shopping_list_items").insert({
    shopping_list_id: shoppingList.id,
    ingredient_name: input.ingredientName.trim(),
    normalized_name: normalizedName,
    quantity: input.quantity,
    unit: input.unit,
    source_type: "manual",
    is_checked: false,
    product_id: input.productId ?? null,
    source_key: null,
  });

  if (error) {
    throw error;
  }

  revalidatePath("/products");
}

export async function updateCurrentWeekShoppingListItem(input: {
  itemId: string;
  ingredientName: string;
  quantity: number;
  unit: IngredientUnit;
}) {
  const item = await fetchCurrentWeekShoppingListItem(input.itemId);

  if (!item) {
    throw new Error("Shopping list item was not found in the current week.");
  }

  const supabase = getSupabaseServerClient();
  const normalizedName =
    getShoppingListNormalizedName(input.ingredientName) || input.ingredientName.trim().toLowerCase();

  if (item.sourceType === "manual") {
    const { error } = await supabase
      .from("shopping_list_items")
      .update({
        ingredient_name: input.ingredientName.trim(),
        normalized_name: normalizedName,
        quantity: input.quantity,
        unit: input.unit,
      })
      .eq("id", item.id)
      .eq("source_type", "manual");

    if (error) {
      throw error;
    }

    revalidatePath("/products");
    return item.id;
  }

  if (!item.sourceKey) {
    throw new Error("Auto shopping list item is missing a stable source key.");
  }

  const nextProductId = item.normalizedName === normalizedName ? item.productId : null;

  await upsertShoppingListItemAdjustment({
    shoppingListId: item.shoppingListId,
    sourceKey: item.sourceKey,
    adjustmentType: "override",
    ingredientName: input.ingredientName,
    quantity: input.quantity,
    unit: input.unit,
    productId: nextProductId,
  });

  return item.id;
}

export async function setShoppingListItemChecked(itemId: string, isChecked: boolean) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("shopping_list_items")
    .update({ is_checked: isChecked })
    .eq("id", itemId);

  if (error) {
    throw error;
  }

  revalidatePath("/products");
}

export async function deleteCurrentWeekShoppingListItem(itemId: string) {
  const item = await fetchCurrentWeekShoppingListItem(itemId);

  if (!item) {
    throw new Error("Shopping list item was not found in the current week.");
  }

  const supabase = getSupabaseServerClient();

  if (item.sourceType === "manual") {
    const { error } = await supabase
      .from("shopping_list_items")
      .delete()
      .eq("id", item.id)
      .eq("source_type", "manual");

    if (error) {
      throw error;
    }

    revalidatePath("/products");
    return;
  }

  if (!item.sourceKey) {
    throw new Error("Auto shopping list item is missing a stable source key.");
  }

  await upsertShoppingListItemAdjustment({
    shoppingListId: item.shoppingListId,
    sourceKey: item.sourceKey,
    adjustmentType: "suppress",
  });
}

export async function upsertShoppingListItemAdjustment(input: {
  shoppingListId: string;
  sourceKey: string;
  adjustmentType: ShoppingListAdjustmentType;
  ingredientName?: string;
  quantity?: number;
  unit?: IngredientUnit;
  productId?: string | null;
}) {
  const supabase = getSupabaseServerClient();
  const normalizedName =
    input.adjustmentType === "override" && input.ingredientName
      ? getShoppingListNormalizedName(input.ingredientName)
      : null;

  const { error } = await supabase.from("shopping_list_item_adjustments").upsert(
    {
      shopping_list_id: input.shoppingListId,
      source_key: input.sourceKey,
      adjustment_type: input.adjustmentType,
      ingredient_name:
        input.adjustmentType === "override" ? input.ingredientName?.trim() ?? null : null,
      normalized_name:
        input.adjustmentType === "override" ? normalizedName : null,
      product_id: input.adjustmentType === "override" ? input.productId ?? null : null,
      quantity:
        input.adjustmentType === "override" ? input.quantity ?? null : null,
      unit: input.adjustmentType === "override" ? input.unit ?? null : null,
    },
    {
      onConflict: "shopping_list_id,source_key",
    },
  );

  if (error) {
    throw error;
  }

  const visibleAutoMaterializationPlan = await assembleContinuityOverlayPlan({
    shoppingListId: input.shoppingListId,
    sourceKeys: [input.sourceKey],
  });

  await materializeVisibleAutoProjectionRows(visibleAutoMaterializationPlan);
  revalidatePath("/products");
}


