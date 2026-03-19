"use server";

import { redirect } from "next/navigation";

import type {
  ProductFormSubmissionState,
  ProductFormValues,
} from "@/lib/product-form";
import {
  archiveProduct,
  createProduct,
  revalidateProductPaths,
  restoreProduct,
  updateProduct,
} from "@/lib/product-crud";
import type { AppLocale } from "@/lib/i18n/config";
import { getTranslation } from "@/lib/i18n/translate";
import {
  getProductDictionaryEditHref,
  getProductLibraryHref,
  parseProductLibraryMode,
} from "@/lib/products";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readLocale(formData: FormData): AppLocale {
  return readText(formData, "locale") === "en" ? "en" : "ru";
}

function parseProductFormData(formData: FormData): ProductFormValues {
  const aliases = formData.getAll("aliasName").map((value, index) => ({
    id: `alias-${index + 1}`,
    value: String(value),
  }));

  return {
    displayName: readText(formData, "displayName"),
    aliases,
  };
}

function buildSaveFailedState(locale: AppLocale): ProductFormSubmissionState {
  return {
    status: "error",
    formError: getTranslation(locale, "products.form.validation.saveFailed"),
    fieldErrors: {
      aliasRows: {},
    },
  };
}

function buildFieldErrorState(args: {
  locale: AppLocale;
  aliasRows?: Record<number, string>;
  duplicate?: ProductFormSubmissionState["duplicate"];
}) {
  const aliasRows = Object.fromEntries(
    Object.entries(args.aliasRows ?? {}).map(([index, code]) => {
      const translationKey =
        code === "alias_matches_display_name"
          ? "products.form.validation.aliasMatchesDisplayName"
          : "products.form.validation.aliasDuplicate";

      return [Number(index), getTranslation(args.locale, translationKey)];
    }),
  );

  return {
    status: "error" as const,
    formError: getTranslation(args.locale, "products.form.validation.fixErrors"),
    fieldErrors: {
      aliasRows,
    },
    duplicate: args.duplicate,
  };
}

export async function createProductAction(
  _previousState: ProductFormSubmissionState,
  formData: FormData,
): Promise<ProductFormSubmissionState> {
  const locale = readLocale(formData);
  const values = parseProductFormData(formData);

  if (!values.displayName.trim()) {
    return {
      status: "error",
      formError: getTranslation(locale, "products.form.validation.fixErrors"),
      fieldErrors: {
        displayName: getTranslation(locale, "products.form.validation.displayNameRequired"),
        aliasRows: {},
      },
    };
  }

  try {
    const result = await createProduct(values);

    if (!result.ok) {
      if ("fieldIssue" in result && result.fieldIssue) {
        return buildFieldErrorState({ locale, aliasRows: result.fieldIssue });
      }

      if ("duplicate" in result && result.duplicate) {
        return buildFieldErrorState({ locale, duplicate: result.duplicate });
      }
    }

    revalidateProductPaths(result.productId);
  } catch (error) {
    console.error("Failed to create product", error);
    return buildSaveFailedState(locale);
  }

  redirect(getProductLibraryHref("active"));
}

export async function updateProductAction(
  _previousState: ProductFormSubmissionState,
  formData: FormData,
): Promise<ProductFormSubmissionState> {
  const locale = readLocale(formData);
  const productId = readText(formData, "productId");
  const mode = parseProductLibraryMode(readText(formData, "mode") || undefined);
  const values = parseProductFormData(formData);

  if (!productId || !values.displayName.trim()) {
    return {
      status: "error",
      formError: getTranslation(locale, "products.form.validation.fixErrors"),
      fieldErrors: {
        displayName: getTranslation(locale, "products.form.validation.displayNameRequired"),
        aliasRows: {},
      },
    };
  }

  try {
    const result = await updateProduct(productId, values);

    if (!result.ok) {
      if ("fieldIssue" in result && result.fieldIssue) {
        return buildFieldErrorState({ locale, aliasRows: result.fieldIssue });
      }

      if ("duplicate" in result && result.duplicate) {
        return buildFieldErrorState({ locale, duplicate: result.duplicate });
      }
    }

    revalidateProductPaths(productId);
  } catch (error) {
    console.error("Failed to update product", error);
    return buildSaveFailedState(locale);
  }

  redirect(getProductDictionaryEditHref(productId, mode));
}

export async function archiveProductAction(formData: FormData) {
  const productId = readText(formData, "productId");

  if (!productId) {
    throw new Error("Missing product id for archive");
  }

  await archiveProduct(productId);
  revalidateProductPaths(productId);
  redirect(getProductLibraryHref("archived"));
}

export async function restoreProductAction(formData: FormData) {
  const productId = readText(formData, "productId");

  if (!productId) {
    throw new Error("Missing product id for restore");
  }

  await restoreProduct(productId);
  revalidateProductPaths(productId);
  redirect(getProductLibraryHref("active"));
}
