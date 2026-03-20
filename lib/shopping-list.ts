import type { IngredientUnit } from "@/lib/dish-form";
import { normalizeProductName } from "@/lib/products-normalization";
import type { MealType } from "@/lib/weekly-menu";

export const shoppingListSourceTypes = ["auto", "manual"] as const;
export const shoppingListAdjustmentTypes = ["override", "suppress"] as const;

export type ShoppingListSourceType = (typeof shoppingListSourceTypes)[number];
export type ShoppingListAdjustmentType = (typeof shoppingListAdjustmentTypes)[number];

export type ShoppingListSourceIdentity = {
  mealPlanId: string;
  productId: string | null;
  normalizedName: string;
  unit: IngredientUnit;
};

export type ShoppingListContributionIdentity = ShoppingListSourceIdentity & {
  dayIndex: number;
  mealType: MealType;
  slotItemKey: string;
};

export type ShoppingListSlotCoordinate = {
  dayIndex: number;
  mealType: MealType;
};

export function getShoppingListNormalizedName(value: string) {
  return normalizeProductName(value);
}

function buildSemanticIdentityPart({
  productId,
  normalizedName,
}: {
  productId: string | null;
  normalizedName: string;
}) {
  return productId
    ? `product:${productId}`
    : `normalized:${normalizedName || "unknown"}`;
}

export function buildShoppingListSourceKey(identity: ShoppingListSourceIdentity) {
  return [
    `meal-plan:${identity.mealPlanId}`,
    buildSemanticIdentityPart(identity),
    `unit:${identity.unit}`,
  ].join("|");
}

export function buildShoppingListContributionKey(
  identity: ShoppingListContributionIdentity,
) {
  return [
    `meal-plan:${identity.mealPlanId}`,
    `day:${identity.dayIndex}`,
    `meal:${identity.mealType}`,
    `slot-item:${identity.slotItemKey}`,
    buildSemanticIdentityPart(identity),
    `unit:${identity.unit}`,
  ].join("|");
}

export function isSlotItemAwareContributionKey(contributionKey: string) {
  return contributionKey.includes("|slot-item:");
}
