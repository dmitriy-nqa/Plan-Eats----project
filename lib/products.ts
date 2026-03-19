export const productLibraryModes = ["active", "archived"] as const;

export type ProductLibraryMode = (typeof productLibraryModes)[number];

export const productsRoute = "/products";
export const productDictionaryRoute = "/settings/product-dictionary";

export function parseProductLibraryMode(value?: string): ProductLibraryMode {
  return value === "archived" ? "archived" : "active";
}

export function getProductLibraryHref(mode: ProductLibraryMode = "active") {
  return mode === "active"
    ? productDictionaryRoute
    : `${productDictionaryRoute}?mode=${mode}`;
}

export function getProductDictionaryCreateHref() {
  return `${productDictionaryRoute}/new`;
}

export function getProductDictionaryEditHref(
  productId: string,
  mode: ProductLibraryMode = "active",
) {
  const encodedProductId = encodeURIComponent(productId);
  const baseHref = `${productDictionaryRoute}/${encodedProductId}/edit`;

  return mode === "active" ? baseHref : `${baseHref}?mode=${mode}`;
}

export type ProductSummary = {
  id: string;
  displayName: string;
  aliasCount: number;
  aliasNames: string[];
  isArchived: boolean;
};

export type ProductSuggestion = {
  id: string;
  displayName: string;
  normalizedName: string;
  tokenKey: string;
  aliasNames: string[];
  aliasNormalizedNames: string[];
  aliasTokenKeys: string[];
  isArchived: boolean;
};

export type ProductDuplicateKind =
  | "valid"
  | "exact_canonical_duplicate"
  | "alias_collision"
  | "archived_collision"
  | "token_duplicate"
  | "redundant_self";

export type ProductDuplicateResult = {
  kind: ProductDuplicateKind;
  productId?: string;
  productName?: string;
  isArchived?: boolean;
  aliasName?: string;
};
