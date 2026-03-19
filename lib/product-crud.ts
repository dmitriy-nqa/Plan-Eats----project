import "server-only";

import { revalidatePath } from "next/cache";

import type {
  ProductFormValues,
  ProductAliasDraft,
} from "@/lib/product-form";
import { getNormalizedProductKeys } from "@/lib/products-normalization";
import type {
  ProductDuplicateResult,
  ProductLibraryMode,
  ProductSuggestion,
  ProductSummary,
} from "@/lib/products";
import {
  getProductDictionaryCreateHref,
  getProductDictionaryEditHref,
  getProductLibraryHref,
} from "@/lib/products";
import {
  getCurrentFamilyId,
  getSupabaseServerClient,
} from "@/lib/supabase/server";

type ProductRow = {
  id: string;
  family_id: string;
  display_name: string;
  normalized_name: string;
  token_key: string;
  is_archived: boolean;
};

type ProductAliasRow = {
  id: string;
  family_id: string;
  product_id: string;
  alias_name: string;
  normalized_name: string;
  token_key: string;
};

export type ProductDetails = {
  id: string;
  displayName: string;
  normalizedName: string;
  tokenKey: string;
  isArchived: boolean;
  aliases: { id: string; value: string }[];
};

type DuplicateCheckInput = {
  displayName: string;
  familyId?: string;
  excludeProductId?: string;
};

function dedupeAliasDrafts(aliases: ProductAliasDraft[]) {
  const seen = new Set<string>();

  return aliases
    .map((alias) => alias.value.trim())
    .filter(Boolean)
    .filter((aliasValue) => {
      const { normalizedName } = getNormalizedProductKeys(aliasValue);

      if (!normalizedName || seen.has(normalizedName)) {
        return false;
      }

      seen.add(normalizedName);
      return true;
    });
}

function validateAliasInputs(displayName: string, aliases: ProductAliasDraft[]) {
  const aliasRows: Record<number, string> = {};
  const { normalizedName: displayNormalizedName } = getNormalizedProductKeys(displayName);
  const seen = new Map<string, number>();

  aliases.forEach((alias, rowIndex) => {
    const trimmedValue = alias.value.trim();

    if (!trimmedValue) {
      return;
    }

    const { normalizedName } = getNormalizedProductKeys(trimmedValue);

    if (!normalizedName) {
      return;
    }

    if (normalizedName === displayNormalizedName) {
      aliasRows[rowIndex] = "alias_matches_display_name";
      return;
    }

    const duplicateRowIndex = seen.get(normalizedName);

    if (duplicateRowIndex !== undefined) {
      aliasRows[rowIndex] = "alias_duplicate";
      aliasRows[duplicateRowIndex] = "alias_duplicate";
      return;
    }

    seen.set(normalizedName, rowIndex);
  });

  return aliasRows;
}

async function fetchProductsByIds(productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, ProductRow>();
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, family_id, display_name, normalized_name, token_key, is_archived")
    .in("id", productIds);

  if (error) {
    throw error;
  }

  return new Map(
    ((data ?? []) as ProductRow[]).map((product) => [product.id, product]),
  );
}

async function fetchAliasesForFamily(familyId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_aliases")
    .select("id, family_id, product_id, alias_name, normalized_name, token_key")
    .eq("family_id", familyId)
    .order("alias_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ProductAliasRow[];
}

function buildDuplicateResult({
  kind,
  product,
  alias,
}: {
  kind: ProductDuplicateResult["kind"];
  product?: ProductRow;
  alias?: ProductAliasRow;
}): ProductDuplicateResult {
  return {
    kind,
    productId: product?.id ?? alias?.product_id,
    productName: product?.display_name,
    isArchived: product?.is_archived,
    aliasName: alias?.alias_name,
  };
}

async function findProductDuplicate({
  displayName,
  familyId = getCurrentFamilyId(),
  excludeProductId,
}: DuplicateCheckInput): Promise<ProductDuplicateResult> {
  const supabase = getSupabaseServerClient();
  const { normalizedName, tokenKey } = getNormalizedProductKeys(displayName);

  if (!normalizedName) {
    return { kind: "valid" };
  }

  const [canonicalExactResult, aliasExactResult, canonicalTokenResult, aliasTokenResult] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, family_id, display_name, normalized_name, token_key, is_archived")
        .eq("family_id", familyId)
        .eq("normalized_name", normalizedName),
      supabase
        .from("product_aliases")
        .select("id, family_id, product_id, alias_name, normalized_name, token_key")
        .eq("family_id", familyId)
        .eq("normalized_name", normalizedName),
      tokenKey
        ? supabase
            .from("products")
            .select("id, family_id, display_name, normalized_name, token_key, is_archived")
            .eq("family_id", familyId)
            .eq("token_key", tokenKey)
        : Promise.resolve({ data: [], error: null }),
      tokenKey
        ? supabase
            .from("product_aliases")
            .select("id, family_id, product_id, alias_name, normalized_name, token_key")
            .eq("family_id", familyId)
            .eq("token_key", tokenKey)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (canonicalExactResult.error) {
    throw canonicalExactResult.error;
  }

  if (aliasExactResult.error) {
    throw aliasExactResult.error;
  }

  if (canonicalTokenResult.error) {
    throw canonicalTokenResult.error;
  }

  if (aliasTokenResult.error) {
    throw aliasTokenResult.error;
  }

  const canonicalExactMatches = ((canonicalExactResult.data ?? []) as ProductRow[]).filter(
    (product) => product.id !== excludeProductId,
  );
  const aliasExactMatches = (aliasExactResult.data ?? []) as ProductAliasRow[];
  const canonicalTokenMatches = ((canonicalTokenResult.data ?? []) as ProductRow[]).filter(
    (product) => product.id !== excludeProductId,
  );
  const aliasTokenMatches = (aliasTokenResult.data ?? []) as ProductAliasRow[];

  if (canonicalExactMatches.length > 0) {
    const product = canonicalExactMatches[0];

    return buildDuplicateResult({
      kind: product.is_archived ? "archived_collision" : "exact_canonical_duplicate",
      product,
    });
  }

  if (aliasExactMatches.length > 0) {
    const aliasOwnerMap = await fetchProductsByIds(
      [...new Set(aliasExactMatches.map((alias) => alias.product_id))],
    );
    const alias = aliasExactMatches.find((match) => match.product_id !== excludeProductId);

    if (alias) {
      const product = aliasOwnerMap.get(alias.product_id);

      return buildDuplicateResult({
        kind: product?.is_archived ? "archived_collision" : "alias_collision",
        product,
        alias,
      });
    }
  }

  if (canonicalTokenMatches.length > 0) {
    const product = canonicalTokenMatches[0];

    return buildDuplicateResult({
      kind: product.is_archived ? "archived_collision" : "token_duplicate",
      product,
    });
  }

  if (aliasTokenMatches.length > 0) {
    const aliasOwnerMap = await fetchProductsByIds(
      [...new Set(aliasTokenMatches.map((alias) => alias.product_id))],
    );
    const alias = aliasTokenMatches.find((match) => match.product_id !== excludeProductId);

    if (alias) {
      const product = aliasOwnerMap.get(alias.product_id);

      return buildDuplicateResult({
        kind: product?.is_archived ? "archived_collision" : "token_duplicate",
        product,
        alias,
      });
    }
  }

  return { kind: "valid" };
}

async function replaceAliasesForProduct(
  productId: string,
  aliases: string[],
  familyId = getCurrentFamilyId(),
) {
  const supabase = getSupabaseServerClient();

  const { error: deleteError } = await supabase
    .from("product_aliases")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    throw deleteError;
  }

  if (aliases.length === 0) {
    return;
  }

  const rows = aliases.map((alias) => {
    const { normalizedName, tokenKey } = getNormalizedProductKeys(alias);

    return {
      family_id: familyId,
      product_id: productId,
      alias_name: alias,
      normalized_name: normalizedName,
      token_key: tokenKey,
    };
  });

  const { error: insertError } = await supabase.from("product_aliases").insert(rows);

  if (insertError) {
    throw insertError;
  }
}

export async function fetchProductsByMode(
  mode: ProductLibraryMode,
): Promise<ProductSummary[]> {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();

  const { data, error } = await supabase
    .from("products")
    .select("id, family_id, display_name, normalized_name, token_key, is_archived")
    .eq("family_id", familyId)
    .eq("is_archived", mode === "archived")
    .order("display_name", { ascending: true });

  if (error) {
    throw error;
  }

  const products = (data ?? []) as ProductRow[];
  const aliases = await fetchAliasesForFamily(familyId);
  const aliasesByProductId = aliases.reduce<Record<string, string[]>>((accumulator, alias) => {
    if (!accumulator[alias.product_id]) {
      accumulator[alias.product_id] = [];
    }

    accumulator[alias.product_id].push(alias.alias_name);
    return accumulator;
  }, {});

  return products.map((product) => ({
    id: product.id,
    displayName: product.display_name,
    aliasCount: aliasesByProductId[product.id]?.length ?? 0,
    aliasNames: aliasesByProductId[product.id] ?? [],
    isArchived: product.is_archived,
  }));
}

export async function fetchProductSuggestions(): Promise<ProductSuggestion[]> {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();

  const [productsResult, aliases] = await Promise.all([
    supabase
      .from("products")
      .select("id, family_id, display_name, normalized_name, token_key, is_archived")
      .eq("family_id", familyId)
      .order("display_name", { ascending: true }),
    fetchAliasesForFamily(familyId),
  ]);

  if (productsResult.error) {
    throw productsResult.error;
  }

  const aliasesByProductId = aliases.reduce<
    Record<string, { aliasNames: string[]; aliasNormalizedNames: string[]; aliasTokenKeys: string[] }>
  >((accumulator, alias) => {
    if (!accumulator[alias.product_id]) {
      accumulator[alias.product_id] = {
        aliasNames: [],
        aliasNormalizedNames: [],
        aliasTokenKeys: [],
      };
    }

    accumulator[alias.product_id].aliasNames.push(alias.alias_name);
    accumulator[alias.product_id].aliasNormalizedNames.push(alias.normalized_name);
    accumulator[alias.product_id].aliasTokenKeys.push(alias.token_key);
    return accumulator;
  }, {});

  return ((productsResult.data ?? []) as ProductRow[]).map((product) => ({
    id: product.id,
    displayName: product.display_name,
    normalizedName: product.normalized_name,
    tokenKey: product.token_key,
    aliasNames: aliasesByProductId[product.id]?.aliasNames ?? [],
    aliasNormalizedNames: aliasesByProductId[product.id]?.aliasNormalizedNames ?? [],
    aliasTokenKeys: aliasesByProductId[product.id]?.aliasTokenKeys ?? [],
    isArchived: product.is_archived,
  }));
}

export async function fetchProductWithAliases(productId: string): Promise<ProductDetails | null> {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, family_id, display_name, normalized_name, token_key, is_archived")
    .eq("family_id", familyId)
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    throw productError;
  }

  if (!product) {
    return null;
  }

  const { data: aliases, error: aliasesError } = await supabase
    .from("product_aliases")
    .select("id, family_id, product_id, alias_name, normalized_name, token_key")
    .eq("product_id", productId)
    .order("alias_name", { ascending: true });

  if (aliasesError) {
    throw aliasesError;
  }

  const productRecord = product as ProductRow;

  return {
    id: productRecord.id,
    displayName: productRecord.display_name,
    normalizedName: productRecord.normalized_name,
    tokenKey: productRecord.token_key,
    isArchived: productRecord.is_archived,
    aliases: ((aliases ?? []) as ProductAliasRow[]).map((alias) => ({
      id: alias.id,
      value: alias.alias_name,
    })),
  };
}

export async function createProduct(values: ProductFormValues) {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();
  const aliasValidationRows = validateAliasInputs(values.displayName, values.aliases);

  if (Object.keys(aliasValidationRows).length > 0) {
    return {
      ok: false as const,
      fieldIssue: aliasValidationRows,
    };
  }

  const duplicate = await findProductDuplicate({
    displayName: values.displayName,
    familyId,
  });

  if (duplicate.kind !== "valid") {
    return {
      ok: false as const,
      duplicate,
    };
  }

  const { normalizedName, tokenKey } = getNormalizedProductKeys(values.displayName);
  const { data, error } = await supabase
    .from("products")
    .insert({
      family_id: familyId,
      display_name: values.displayName.trim(),
      normalized_name: normalizedName,
      token_key: tokenKey,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  const aliases = dedupeAliasDrafts(values.aliases);

  for (const alias of aliases) {
    const aliasDuplicate = await findProductDuplicate({
      displayName: alias,
      familyId,
      excludeProductId: data.id,
    });

    if (aliasDuplicate.kind !== "valid") {
      await supabase.from("products").delete().eq("id", data.id);

      return {
        ok: false as const,
        duplicate: aliasDuplicate,
      };
    }
  }

  await replaceAliasesForProduct(data.id, aliases, familyId);
  return {
    ok: true as const,
    productId: data.id,
  };
}

export async function updateProduct(productId: string, values: ProductFormValues) {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();
  const existingProduct = await fetchProductWithAliases(productId);

  if (!existingProduct) {
    throw new Error("Product not found");
  }

  const nextDisplayName = values.displayName.trim();
  const { normalizedName, tokenKey } = getNormalizedProductKeys(nextDisplayName);
  const matchingOwnAlias = existingProduct.aliases.find((alias) => {
    return getNormalizedProductKeys(alias.value).normalizedName === normalizedName;
  });
  const aliasValidationRows = validateAliasInputs(values.displayName, values.aliases);

  if (matchingOwnAlias) {
    values.aliases.forEach((alias, rowIndex) => {
      const { normalizedName: aliasNormalizedName } = getNormalizedProductKeys(alias.value);

      if (
        aliasNormalizedName === normalizedName
        && aliasValidationRows[rowIndex] === "alias_matches_display_name"
      ) {
        delete aliasValidationRows[rowIndex];
      }
    });
  }

  if (Object.keys(aliasValidationRows).length > 0) {
    return {
      ok: false as const,
      fieldIssue: aliasValidationRows,
    };
  }

  const duplicate = await findProductDuplicate({
    displayName: nextDisplayName,
    familyId,
    excludeProductId: productId,
  });

  if (duplicate.kind !== "valid" && !matchingOwnAlias) {
    return {
      ok: false as const,
      duplicate,
    };
  }

  const previousDisplayName = existingProduct.displayName.trim();
  const previousAliases = existingProduct.aliases.map((alias) => alias.value);

  const normalizedAliases = dedupeAliasDrafts(values.aliases);
  const nextAliases = normalizedAliases.filter((alias) => {
    return getNormalizedProductKeys(alias).normalizedName !== normalizedName;
  });

  if (
    matchingOwnAlias &&
    getNormalizedProductKeys(previousDisplayName).normalizedName !== normalizedName
  ) {
    nextAliases.push(previousDisplayName);
  }

  for (const alias of nextAliases) {
    const aliasDuplicate = await findProductDuplicate({
      displayName: alias,
      familyId,
      excludeProductId: productId,
    });

    if (aliasDuplicate.kind !== "valid") {
      return {
        ok: false as const,
        duplicate: aliasDuplicate,
      };
    }
  }

  if (matchingOwnAlias) {
    const { error: deleteAliasesError } = await supabase
      .from("product_aliases")
      .delete()
      .eq("product_id", productId);

    if (deleteAliasesError) {
      throw deleteAliasesError;
    }
  }

  const { error: updateError } = await supabase
    .from("products")
    .update({
      display_name: nextDisplayName,
      normalized_name: normalizedName,
      token_key: tokenKey,
    })
    .eq("id", productId)
    .eq("family_id", familyId);

  if (updateError) {
    if (matchingOwnAlias) {
      await replaceAliasesForProduct(productId, previousAliases, familyId);
    }

    throw updateError;
  }

  await replaceAliasesForProduct(productId, nextAliases, familyId);
  return {
    ok: true as const,
  };
}

export async function archiveProduct(productId: string) {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();

  const { error } = await supabase
    .from("products")
    .update({ is_archived: true })
    .eq("id", productId)
    .eq("family_id", familyId);

  if (error) {
    throw error;
  }
}

export async function restoreProduct(productId: string) {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();

  const { error } = await supabase
    .from("products")
    .update({ is_archived: false })
    .eq("id", productId)
    .eq("family_id", familyId);

  if (error) {
    throw error;
  }
}

export async function removeProductAlias(aliasId: string, productId: string) {
  const supabase = getSupabaseServerClient();
  const familyId = getCurrentFamilyId();

  const { error } = await supabase
    .from("product_aliases")
    .delete()
    .eq("id", aliasId)
    .eq("product_id", productId)
    .eq("family_id", familyId);

  if (error) {
    throw error;
  }
}

export async function validateProductFormInput(
  values: ProductFormValues,
  options?: { excludeProductId?: string },
) {
  const aliasValidationRows = validateAliasInputs(values.displayName, values.aliases);

  if (Object.keys(aliasValidationRows).length > 0) {
    return {
      fieldIssue: aliasValidationRows,
      duplicate: undefined,
    };
  }

  const duplicate = await findProductDuplicate({
    displayName: values.displayName,
    excludeProductId: options?.excludeProductId,
  });

  return {
    fieldIssue: undefined,
    duplicate,
  };
}

export function revalidateProductPaths(productId?: string) {
  revalidatePath(getProductLibraryHref("active"));
  revalidatePath(getProductLibraryHref("archived"));
  revalidatePath(getProductDictionaryCreateHref());
  revalidatePath("/settings");

  if (productId) {
    revalidatePath(getProductDictionaryEditHref(productId, "active"));
    revalidatePath(getProductDictionaryEditHref(productId, "archived"));
  }
}
