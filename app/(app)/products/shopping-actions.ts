"use server";

import { redirect } from "next/navigation";

import {
  initialShoppingListFormSubmissionState,
  normalizeShoppingListFormValues,
  shoppingListUnits,
  type ShoppingListFormSubmissionState,
  type ShoppingListFormValues,
  validateShoppingListFormValues,
} from "@/lib/shopping-list-form";
import { getShoppingListCopy } from "@/lib/shopping-list-copy";
import type { AppLocale } from "@/lib/i18n/config";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readLocale(formData: FormData): AppLocale {
  return readText(formData, "locale") === "en" ? "en" : "ru";
}

function parseUnit(value: string): ShoppingListFormValues["unit"] {
  return shoppingListUnits.includes(value as ShoppingListFormValues["unit"])
    ? (value as ShoppingListFormValues["unit"])
    : "pcs";
}

function parseShoppingListFormData(formData: FormData): ShoppingListFormValues {
  return {
    ingredientName: readText(formData, "ingredientName"),
    quantity: readText(formData, "quantity"),
    unit: parseUnit(readText(formData, "unit")),
  };
}

function buildValidationState(
  locale: AppLocale,
  values: ShoppingListFormValues,
): ShoppingListFormSubmissionState {
  const issues = validateShoppingListFormValues(values);

  if (issues.length === 0) {
    return initialShoppingListFormSubmissionState;
  }

  const copy = getShoppingListCopy(locale);
  const fieldErrors: ShoppingListFormSubmissionState["fieldErrors"] = {};

  for (const issue of issues) {
    if (issue.code === "ingredient_name_required") {
      fieldErrors.ingredientName = copy.form.validationNameRequired;
      continue;
    }

    fieldErrors.quantity = copy.form.validationQuantityInvalid;
  }

  return {
    status: "error",
    formError: copy.form.validationFixErrors,
    fieldErrors,
  };
}

function buildSaveFailedState(locale: AppLocale): ShoppingListFormSubmissionState {
  const copy = getShoppingListCopy(locale);

  return {
    status: "error",
    formError: copy.form.validationSaveFailed,
    fieldErrors: {},
  };
}

export async function createShoppingListItemAction(
  _previousState: ShoppingListFormSubmissionState,
  formData: FormData,
): Promise<ShoppingListFormSubmissionState> {
  const locale = readLocale(formData);
  const values = parseShoppingListFormData(formData);
  const validationState = buildValidationState(locale, values);

  if (validationState.status === "error") {
    return validationState;
  }

  try {
    const { createManualCurrentWeekShoppingListItem } = await import("@/lib/shopping-list-crud");
    const normalizedValues = normalizeShoppingListFormValues(values);

    await createManualCurrentWeekShoppingListItem(normalizedValues);
  } catch (error) {
    console.error("Failed to create shopping list item", error);
    return buildSaveFailedState(locale);
  }

  redirect("/products");
}

export async function updateShoppingListItemAction(
  _previousState: ShoppingListFormSubmissionState,
  formData: FormData,
): Promise<ShoppingListFormSubmissionState> {
  const locale = readLocale(formData);
  const itemId = readText(formData, "itemId");
  const values = parseShoppingListFormData(formData);
  const validationState = buildValidationState(locale, values);

  if (!itemId) {
    return buildSaveFailedState(locale);
  }

  if (validationState.status === "error") {
    return validationState;
  }

  try {
    const { updateCurrentWeekShoppingListItem } = await import("@/lib/shopping-list-crud");
    const normalizedValues = normalizeShoppingListFormValues(values);

    await updateCurrentWeekShoppingListItem({
      itemId,
      ...normalizedValues,
    });
  } catch (error) {
    console.error("Failed to update shopping list item", error);
    return buildSaveFailedState(locale);
  }

  redirect("/products");
}

export async function toggleShoppingListItemCheckedAction(formData: FormData) {
  const itemId = readText(formData, "itemId");
  const nextChecked = readText(formData, "nextChecked") === "true";

  if (!itemId) {
    throw new Error("Missing shopping list item id.");
  }

  const { setShoppingListItemChecked } = await import("@/lib/shopping-list-crud");
  await setShoppingListItemChecked(itemId, nextChecked);
}

export async function deleteShoppingListItemAction(formData: FormData) {
  const itemId = readText(formData, "itemId");
  const redirectTo = readText(formData, "redirectTo");

  if (!itemId) {
    throw new Error("Missing shopping list item id.");
  }

  const { deleteCurrentWeekShoppingListItem } = await import("@/lib/shopping-list-crud");
  await deleteCurrentWeekShoppingListItem(itemId);

  if (redirectTo) {
    redirect(redirectTo);
  }
}
