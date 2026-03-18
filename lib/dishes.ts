import { getTranslation } from "@/lib/i18n/translate";
import type { AppLocale, TranslationKey } from "@/lib/i18n/config";

export const dishCategoryValues = [
  "breakfast",
  "soup",
  "salad",
  "main_course",
  "bakery_and_desserts",
] as const;

export type DishCategory = (typeof dishCategoryValues)[number];
export const dishLibraryModes = ["active", "archived"] as const;
export type DishLibraryMode = (typeof dishLibraryModes)[number];

const dishCategoryTranslationKeys: Record<DishCategory, TranslationKey> = {
  breakfast: "domain.dishCategory.breakfast",
  soup: "domain.dishCategory.soup",
  salad: "domain.dishCategory.salad",
  main_course: "domain.dishCategory.mainCourse",
  bakery_and_desserts: "domain.dishCategory.bakeryAndDesserts",
};

export function getDishCategoryLabel(
  category: DishCategory,
  locale: AppLocale = "en",
) {
  return getTranslation(locale, dishCategoryTranslationKeys[category]);
}

export function parseDishLibraryMode(value?: string): DishLibraryMode {
  return value === "archived" ? "archived" : "active";
}

export function getDishLibraryHref(mode: DishLibraryMode = "active") {
  return mode === "active" ? "/dishes" : `/dishes?mode=${mode}`;
}

function stripRecipeLinePrefix(line: string) {
  return line.replace(/^((\d+[\).\:-]?)|[-*•])\s+/, "").trim();
}

function getRecipeSummaryLine(recipeText?: string | null) {
  if (!recipeText) {
    return undefined;
  }

  const lines = recipeText
    .split(/\r?\n/)
    .map((line) => stripRecipeLinePrefix(line.trim()))
    .filter(Boolean);

  return lines[0];
}

export function getDishDerivedSummary({
  comment,
  recipeText,
  placeholder = "No short summary yet.",
}: {
  comment?: string | null;
  recipeText?: string | null;
  placeholder?: string;
}) {
  const normalizedComment = comment?.trim();

  if (normalizedComment) {
    return normalizedComment;
  }

  const recipeLine = getRecipeSummaryLine(recipeText);

  if (recipeLine) {
    return recipeLine;
  }

  return placeholder;
}

export type DishSummary = {
  id: string;
  name: string;
  category: DishCategory;
  summary: string;
};
