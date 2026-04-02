export const mealPlanSourceAuthorityColumn = "source_version" as const;

export const shoppingListFreshnessStates = [
  "no_projection",
  "fresh",
  "stale_pending",
  "updating",
  "failed_latest",
] as const;

export const shoppingListControlPlaneColumns = [
  "published_source_version",
  "freshness_state",
  "recompute_requested_at",
  "claim_token",
  "claim_target_version",
  "claim_expires_at",
  "last_failure_at",
  "last_failure_source_version",
  "last_failure_reason",
] as const;

export const shoppingListControlPlaneSelect = shoppingListControlPlaneColumns.join(", ");

export type ShoppingListFreshnessState = (typeof shoppingListFreshnessStates)[number];

export type ShoppingListSourceVersionValue = string | number | bigint;

export type MealPlanSourceAuthorityRow = {
  source_version: ShoppingListSourceVersionValue;
};

export type ShoppingListControlPlaneRow = {
  published_source_version: ShoppingListSourceVersionValue | null;
  freshness_state: ShoppingListFreshnessState;
  recompute_requested_at: string | null;
  claim_token: string | null;
  claim_target_version: ShoppingListSourceVersionValue | null;
  claim_expires_at: string | null;
  last_failure_at: string | null;
  last_failure_source_version: ShoppingListSourceVersionValue | null;
  last_failure_reason: string | null;
};

// Phase 1 rollout note:
// These fields are physically co-located on shopping_lists only to keep the rollout
// additive and low-risk. They form a logically separate recompute-control submodel and
// should not slowly expand shopping_lists into a permanent god-row.
export function getAuthoritativeMealPlanSourceVersion(row: MealPlanSourceAuthorityRow) {
  return normalizeSourceVersionValue(row.source_version);
}

export function getPublishedShoppingListSourceVersion(row: ShoppingListControlPlaneRow) {
  if (row.published_source_version === null) {
    return null;
  }

  return normalizeSourceVersionValue(row.published_source_version);
}

export function hasPublishedShoppingListBaseline(row: ShoppingListControlPlaneRow) {
  return getPublishedShoppingListSourceVersion(row) !== null;
}

export function isShoppingListFreshnessState(
  value: string,
): value is ShoppingListFreshnessState {
  return (shoppingListFreshnessStates as readonly string[]).includes(value);
}

export function formatSourceVersionForWrite(value: ShoppingListSourceVersionValue) {
  return normalizeSourceVersionValue(value).toString();
}

function normalizeSourceVersionValue(value: ShoppingListSourceVersionValue) {
  if (typeof value === "bigint") {
    if (value < BigInt(0)) {
      throw new Error("Source version cannot be negative.");
    }

    return value;
  }

  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error("Source version must be a non-negative integer.");
    }

    return BigInt(value);
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    throw new Error("Source version cannot be blank.");
  }

  const normalizedValue = BigInt(trimmedValue);

  if (normalizedValue < BigInt(0)) {
    throw new Error("Source version cannot be negative.");
  }

  return normalizedValue;
}
